import { errors } from "@/errors";
import {
  CreateMessageInput,
  GetMessageInput,
  DeleteMessageInput,
  ListMessageFilters,
} from "@/types";
import {
  validateStringField,
  validateTagsField,
  validateMetadataField,
  validateCreatedField,
} from "@/utils/validation";
import { isPlainObject } from "@/utils/lodash";

/**
 * Media types accepted on an image part. Both Anthropic and OpenAI support
 * exactly this set.
 */
const SUPPORTED_IMAGE_MEDIA_TYPES: string[] = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

/** The shape of a base64 payload once its whitespace is gone. */
const BASE64_SHAPE = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * Is this a base64 payload the SDK will let through?
 *
 * Whitespace is allowed: line-wrapped base64 is common in copied payloads, and
 * base64 read from a file usually ends with a newline. It is stripped in a
 * separate pass rather than folded into the character class, and that is not a
 * style choice. The single pattern this replaces was
 *
 *   /^(?=\s*[A-Za-z0-9+\/])[A-Za-z0-9+\/\s]+={0,2}\s*$/
 *
 * where `[A-Za-z0-9+/\s]+` and the trailing `\s*` can both consume the same
 * whitespace. On a payload that ends up failing, the engine retries the tail
 * from every position inside a whitespace run, which is quadratic in the length
 * of that run: measured on node 20, 50 KB of spaces took 0.9s, 100 KB took 3.5s
 * and 400 KB took 70s, all of it blocking the caller's own thread. source.data
 * carries up to 25 MB and is entirely caller-supplied, so a payload that
 * arrived mangled hangs the process instead of returning the error it was about
 * to return. Both steps below are single-pass.
 *
 * Requiring one real base64 character after the strip is what stops whitespace
 * ALONE from qualifying: "   " has nothing to decode, and the length check at
 * the call site cannot catch it because it is not empty.
 *
 * One payload the old pattern rejected is now accepted: padding that is itself
 * line-wrapped, "AA=\n=". It decodes fine, and the SDK is not supposed to add
 * rejections the API does not make. Verified by differential fuzzing that this
 * is the only direction the two disagree in.
 */
function isAcceptableBase64(value: string): boolean {
  const withoutWhitespace = value.replace(/\s+/g, "");
  return withoutWhitespace.length > 0 && BASE64_SHAPE.test(withoutWhitespace);
}

/**
 * A data URI, split the way RFC 2397 defines one:
 * `data:[<mediatype>][;<parameter>]*[;base64],<data>`.
 *
 * Deliberately mirrors the API's own parser (the media type, the FULL parameter
 * list, then the payload) instead of hard-coding one shape. The previous
 * pattern required exactly `data:<type>/<subtype>;base64,` with a non-empty
 * media type and no other parameters, so it rejected two forms the API accepts,
 * stores, and returns byte for byte:
 *
 *   data:image/png;charset=utf-8;base64,<payload>   extra parameter
 *   data:;base64,<payload>                          media type omitted
 *
 * Both are legal RFC 2397, and the SDK is not supposed to add rejections the
 * API does not make - a caller with either one got INVALID_PARAMETER from us
 * for a payload the API would have taken.
 */
const DATA_URI_PATTERN = /^data:([^;,]*)((?:;[^;,]*)*),([\s\S]*)$/i;

/** The base64 payload of a data URI, or null when it is not a base64 one. */
function parseBase64DataUri(
  value: string
): { mediaType: string | null; base64: string } | null {
  const match = DATA_URI_PATTERN.exec(value);
  if (!match) {
    return null;
  }
  // Lowercased before comparison for the same reason the scheme is matched
  // case-insensitively: ";BASE64" is the same declaration.
  const parameters = (match[2] || "")
    .split(";")
    .filter(Boolean)
    .map((parameter) => parameter.toLowerCase());
  if (parameters.indexOf("base64") === -1) {
    return null;
  }
  return { mediaType: match[1] ? match[1] : null, base64: match[3] };
}

/**
 * Does this string begin a data URI?
 *
 * Case-insensitive, matching DATA_URI_PATTERN above and RFC 2397, which makes
 * the scheme case-insensitive. The two gates below used startsWith("data:")
 * while the pattern they guard was already case-insensitive, so an uppercase
 * URI took the early return and skipped validation entirely: the one branch
 * that would have accepted it never ran.
 */
const DATA_URI_PREFIX = /^data:/i;

/**
 * Validates the two image spellings DialogueDB recognizes, and only those.
 * Unrecognized blocks pass through exactly as before.
 *
 * Where this sits relative to the API, stated exactly rather than as a blanket
 * "no new rejections", because two of these checks ARE stricter and a future
 * reader needs to know which:
 *
 * - `data:` prefix in the Anthropic `source.data`: the API rejects this too
 *   (INVALID_IMAGE_CONTENT). Offload replaces that field with a pointer, so the
 *   prefix could not be restored on read and content is write-once. Checked
 *   wherever that field holds a string, because that is when the API checks it:
 *   `source.type` does not gate it there and must not gate it here.
 * - data URI shape in `image_url.url`: parsed exactly as the API parses it, so
 *   the two agree on what is a base64 data URI - AND on what is not one. A data
 *   URI with no `;base64` parameter is not a malformed image, it is a
 *   url-origin part, and both sides treat it as one. See DATA_URI_PATTERN.
 * - base64 payload characters, and the media-type allowlist: STRICTER than the
 *   API on purpose. The API stores an unrecognized payload as ordinary content
 *   and never validates a declared media_type at all, so both of those failures
 *   surface much later as "my image was stored but search never matches it".
 *   Catching a typo at the call site is worth the divergence; widening either
 *   check is safe, narrowing the API to match is not.
 *
 * The offending payload is deliberately never attached as the error `value`:
 * a rejected multi-megabyte base64 string must not be copied into an error
 * object that gets logged and serialized.
 */
/**
 * The service API's request body ceiling, in bytes.
 *
 * Not a plan limit and not something the caller can raise: it is the express
 * body-parser limit on the ECS surface that serves message writes. Kept here
 * because the SDK is the only layer that can see the whole request before it
 * is sent.
 */
const REQUEST_BODY_CEILING_BYTES = 36 * 1024 * 1024;

/**
 * Base64 costs four characters per three bytes, so a payload's wire size is
 * larger than its decoded size by a third.
 */
function encodedLengthOf(base64: string): number {
  return base64.length;
}

/**
 * Reject a request whose inline images cannot fit in one body.
 *
 * `maxImageBytes` and `maxImagePartCount` are INDEPENDENT caps, not a budget
 * that multiplies: 20 parts of 25 MB each is 500 MB, and the request ceiling is
 * 36 MB. A caller who reads the documented limits and sends two 20 MB images is
 * inside both, and the request dies at the transport before anything parses it.
 *
 * That failure is a bare 413 with no JSON body, naming no image and no limit,
 * because the body parser runs before route matching. It is indistinguishable
 * from an outage and there is no `requestId` to chase.
 *
 * The server cannot improve on it: by the time our code runs the body has
 * already been refused. The SDK can, because it holds the parts before
 * serialising them. This is the one check here that exists purely to turn an
 * opaque transport failure into an actionable message.
 *
 * URL-origin images are excluded deliberately: they carry no bytes in the
 * request, which is exactly the workaround this error recommends.
 */
function assertInlineImagesFitOneRequest(
  content: Array<Record<string, any>>
): void {
  let encoded = 0;

  for (const part of content) {
    if (part?.type === "image" && isPlainObject(part.source)) {
      const data = (part.source as Record<string, any>).data;
      if (typeof data === "string") {
        encoded += encodedLengthOf(data);
      }
      continue;
    }
    if (part?.type === "image_url" && isPlainObject(part.image_url)) {
      const url = (part.image_url as Record<string, any>).url;
      if (typeof url === "string" && DATA_URI_PREFIX.test(url)) {
        encoded += encodedLengthOf(url);
      }
    }
  }

  if (encoded > REQUEST_BODY_CEILING_BYTES) {
    const mib = (value: number) => `${(value / (1024 * 1024)).toFixed(1)} MiB`;
    // No payloads in the error: it is logged and serialised, and these parts
    // are megabytes each.
    throw errors.invalidParameter(
      "content",
      `inline images encode to ${mib(encoded)}, over the ${mib(
        REQUEST_BODY_CEILING_BYTES
      )} request limit. The per-image and per-message limits are separate caps, not a combined budget: base64 costs four bytes per three, so roughly ${mib(
        (REQUEST_BODY_CEILING_BYTES * 3) / 4
      )} of image data fits in one request. Send fewer images per message, or reference them by URL, which carries no bytes in the request.`
    );
  }
}

function validateImagePart(part: Record<string, any>, index: number): void {
  if (part.type === "image" && isPlainObject(part.source)) {
    const source = part.source as Record<string, any>;
    // Ahead of the source.type gate on purpose. The API reads source.data
    // first and only falls through to source.url when there is no string there
    // (helpers/dialogue/images/detect.ts detectAnthropicImage), so it raises
    // INVALID_IMAGE_CONTENT for a data: URI in this field whatever source.type
    // says - including when source.type was left off, which is the easiest
    // field in the shape to forget. Behind the gate, that caller uploaded the
    // whole payload to be told by the server what we could have told them
    // before the request left the process.
    if (typeof source.data === "string" && DATA_URI_PREFIX.test(source.data)) {
      throw errors.invalidParameter(
        "content",
        `item ${index}: image source.data must be raw base64 without a "data:" prefix`
      );
    }
    if (source.type !== "base64") {
      // url-origin images are stored and returned verbatim, not ours to police.
      return;
    }
    if (typeof source.data !== "string" || source.data.length === 0) {
      throw errors.invalidParameter(
        "content",
        `item ${index}: image source.data must be a non-empty base64 string`
      );
    }
    if (!isAcceptableBase64(source.data)) {
      throw errors.invalidParameter(
        "content",
        `item ${index}: image source.data is not valid base64`
      );
    }
    if (
      typeof source.media_type !== "string" ||
      SUPPORTED_IMAGE_MEDIA_TYPES.indexOf(source.media_type.toLowerCase()) ===
        -1
    ) {
      throw errors.invalidParameter(
        "content",
        `item ${index}: image source.media_type must be one of ${SUPPORTED_IMAGE_MEDIA_TYPES.join(
          ", "
        )}`
      );
    }
    return;
  }

  if (part.type === "image_url" && isPlainObject(part.image_url)) {
    const url = (part.image_url as Record<string, any>).url;
    if (typeof url !== "string" || url.length === 0) {
      throw errors.invalidParameter(
        "content",
        `item ${index}: image_url.url must be a non-empty string`
      );
    }
    if (!DATA_URI_PREFIX.test(url)) {
      // A genuine remote URL. Stored and returned verbatim, not ours to police.
      return;
    }
    const dataUri = parseBase64DataUri(url);
    if (!dataUri) {
      // A data URI that never claimed to be base64: no `;base64` parameter, so
      // the payload is literal or percent-encoded. `data:image/svg+xml,%3Csvg
      // .../%3E` is the everyday example, `data:image/gif,...` the typo.
      //
      // The API's parser returns null on exactly this input too
      // (helpers/dialogue/images/detect.ts parseDataUri) and files the part as
      // url-origin: stored and returned verbatim, same as a remote URL, no
      // rejection. Treating it as a malformed base64 URI made an inline SVG the
      // product accepts fail inside the caller's own dependency, with a message
      // about base64 they never asked for.
      return;
    }
    if (!isAcceptableBase64(dataUri.base64)) {
      throw errors.invalidParameter(
        "content",
        `item ${index}: image_url.url is not a well-formed base64 data URI`
      );
    }
    // Only checked when one is declared. RFC 2397 lets the media type be
    // omitted and the API accepts that, so an absent one must not be reported
    // as an unsupported one.
    if (
      dataUri.mediaType !== null &&
      SUPPORTED_IMAGE_MEDIA_TYPES.indexOf(dataUri.mediaType.toLowerCase()) ===
        -1
    ) {
      throw errors.invalidParameter(
        "content",
        `item ${index}: image_url.url media type must be one of ${SUPPORTED_IMAGE_MEDIA_TYPES.join(
          ", "
        )}`
      );
    }
  }
}

function validateContentField(content: unknown): void {
  if (content === undefined || content === null || content === "") {
    throw errors.missingParameter("content");
  }
  // Content can be: string, plain object, or array of plain objects
  if (typeof content === "string") {
    return;
  }
  if (Array.isArray(content)) {
    // An empty array carries no content, same as "" or null above. Array.every
    // returns true for [], so without this guard it would pass silently.
    if (content.length === 0) {
      throw errors.missingParameter("content");
    }
    if (!content.every((item) => isPlainObject(item))) {
      // No third argument: the array can hold multi-megabyte image payloads,
      // and this error is logged and serialized. See validateImagePart above.
      throw errors.invalidParameter(
        "content",
        "array must contain only objects"
      );
    }
    assertInlineImagesFitOneRequest(content as Array<Record<string, any>>);
    content.forEach((item, index) =>
      validateImagePart(item as Record<string, any>, index)
    );
    return;
  }
  if (!isPlainObject(content)) {
    throw errors.invalidParameter(
      "content",
      "must be a string, object, or array of objects",
      content
    );
  }
  // A bare object can itself be a single image part.
  validateImagePart(content as Record<string, any>, 0);
}

/**
 * Validates CreateMessageInput, throwing DialogueDBError if invalid.
 */
export function validateCreateMessageInput(input: CreateMessageInput): void {
  // Required fields
  if (!input.dialogueId) {
    throw errors.missingParameter("dialogueId");
  }
  validateStringField(input.dialogueId, "dialogueId", 5);

  if (!input.role) {
    throw errors.missingParameter("role");
  }
  validateStringField(input.role, "role", 1);

  validateContentField(input.content);

  // Optional fields
  if (input.id !== undefined) {
    validateStringField(input.id, "id", 5);
  }

  if (input.name !== undefined) {
    validateStringField(input.name, "name");
  }

  if (input.tags !== undefined) {
    validateTagsField(input.tags);
  }

  if (input.metadata !== undefined) {
    validateMetadataField(input.metadata);
  }

  if (input.created !== undefined) {
    validateCreatedField(input.created);
  }
}

/**
 * Validates GetMessageInput or DeleteMessageInput, throwing DialogueDBError if invalid.
 */
export function validateGetMessageInput(
  input: GetMessageInput | DeleteMessageInput
): void {
  if (!input.dialogueId) {
    throw errors.missingParameter("dialogueId");
  }
  validateStringField(input.dialogueId, "dialogueId");

  if (!input.id) {
    throw errors.missingParameter("id");
  }
  validateStringField(input.id, "id");
}

/**
 * Validates ListMessageFilters, throwing DialogueDBError if invalid.
 */
export function validateListMessageFilters(input: ListMessageFilters): void {
  if (!input.dialogueId) {
    throw errors.missingParameter("dialogueId");
  }
  validateStringField(input.dialogueId, "dialogueId");

  if (input.limit !== undefined) {
    if (
      typeof input.limit !== "number" ||
      !Number.isInteger(input.limit) ||
      input.limit < 1
    ) {
      throw errors.invalidParameter(
        "limit",
        "must be a positive integer",
        input.limit
      );
    }
  }

  if (input.order !== undefined) {
    if (input.order !== "asc" && input.order !== "desc") {
      throw errors.invalidParameter(
        "order",
        "must be 'asc' or 'desc'",
        input.order
      );
    }
  }

  if (input.next !== undefined) {
    validateStringField(input.next, "next");
  }
}
