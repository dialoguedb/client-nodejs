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
 * Whitespace is tolerated: line-wrapped base64 is common in copied payloads,
 * and base64 read from a file usually ends with a newline. It is stripped in a
 * single pass before the shape is checked, rather than folded into the
 * character class, so that a long run of whitespace in a mangled payload cannot
 * make matching cost grow with the square of its length and stall the calling
 * thread. `source.data` can carry up to 25 MB, so that cost is worth avoiding.
 *
 * Stripping first is also what rejects whitespace ALONE: "   " has nothing to
 * decode, and the non-empty check at the call site cannot catch it because the
 * string is not empty.
 *
 * Line-wrapped padding such as "AA=\n=" is accepted. It decodes fine, and this
 * check is not meant to reject anything the API would accept.
 */
function isAcceptableBase64(value: string): boolean {
  const withoutWhitespace = value.replace(/\s+/g, "");
  return withoutWhitespace.length > 0 && BASE64_SHAPE.test(withoutWhitespace);
}

/**
 * A data URI, split the way RFC 2397 defines one:
 * `data:[<mediatype>][;<parameter>]*[;base64],<data>`.
 *
 * The media type is optional and any number of parameters may precede
 * `;base64`, so both of these are valid and both are accepted:
 *
 *   data:image/png;charset=utf-8;base64,<payload>   extra parameter
 *   data:;base64,<payload>                          media type omitted
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
 * Case-insensitive, matching DATA_URI_PATTERN and RFC 2397, which makes the
 * scheme case-insensitive: `DATA:image/png;base64,...` is validated exactly
 * like its lowercase spelling.
 */
const DATA_URI_PREFIX = /^data:/i;

/**
 * Validates the two image shapes DialogueDB recognizes, and only those. Any
 * other content block is passed through untouched.
 *
 * Which of these checks are local and which mirror the server:
 *
 * - A `data:` prefix inside `source.data` (the Anthropic shape): rejected here
 *   and rejected by the API. `source.data` must hold raw base64. Checked
 *   whenever that field holds a string, regardless of `source.type`, because
 *   that is when the API checks it too.
 * - The data URI shape in `image_url.url` (the OpenAI shape): parsed the same
 *   way the API parses it, so the two agree on what is a base64 data URI and
 *   on what is not. A data URI with no `;base64` parameter is not a malformed
 *   image, it is a url-origin part, and it is stored as one. See
 *   DATA_URI_PATTERN.
 * - Base64 payload characters and the media-type allowlist: checked locally
 *   and stricter than the API. An unreadable payload or an unrecognized
 *   media_type is stored as ordinary content, so the mistake surfaces much
 *   later as an image that saved fine but never matches a search. Failing at
 *   the call site makes a typo obvious straight away.
 *
 * The rejected payload is never attached to the error: a multi-megabyte base64
 * string should not be copied into an error object that gets logged and
 * serialized.
 */
/**
 * The maximum size of a single request body, in bytes.
 *
 * A fixed transport limit rather than a plan limit: it is the same on every
 * plan and cannot be raised. Checked here because the SDK is the only layer
 * that can see the whole request before it is sent.
 */
export const REQUEST_BODY_CEILING_BYTES = 36 * 1024 * 1024;

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
 * that multiplies: 20 parts of 25 MB each is 500 MB, while a single request
 * body cannot exceed 36 MB. A caller who reads the documented limits and sends
 * two 20 MB images is inside both and still exceeds the request size.
 *
 * Without this check the request is refused in transit: a bare 413 with no JSON
 * body, naming no image and no limit, and with no `requestId` to follow up on.
 * Checking before the request is sent turns that into an error that says which
 * limit was exceeded and what to do about it.
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

/**
 * Batch sibling of `assertInlineImagesFitOneRequest`, measured on the real body.
 *
 * The per-message guard above is applied to each message independently, and a
 * batch sends every message in one body. Four 12 MiB messages each pass it and
 * the ~48 MiB batch is refused in transit with the same bare, requestId-less
 * 413 that guard exists to eliminate.
 *
 * Measured on the serialised string rather than by summing base64 lengths,
 * because the batch envelope is not negligible: JSON keys, text parts, metadata
 * and up to 25 sets of braces all count toward the same limit. The caller is
 * about to serialise anyway, so the exact number is free and no headroom has to
 * be guessed at.
 *
 * Takes the serialised body so it cannot disagree with what is actually sent.
 */
export function assertBatchBodyFitsOneRequest(body: string): void {
  const bytes = Buffer.byteLength(body, "utf8");
  if (bytes <= REQUEST_BODY_CEILING_BYTES) {
    return;
  }

  const mib = (value: number) => `${(value / (1024 * 1024)).toFixed(1)} MiB`;
  // No payload in the error: it is logged and serialised, and this body is
  // megabytes by definition.
  throw errors.invalidParameter(
    "messages",
    `this batch serialises to ${mib(bytes)}, over the ${mib(
      REQUEST_BODY_CEILING_BYTES
    )} request limit. The per-image and per-message limits are separate caps, not a combined budget, and a batch sends every message in one body. Split the batch across several calls, or reference images by URL, which carries no bytes in the request.`
  );
}

function validateImagePart(part: Record<string, any>, index: number): void {
  if (part.type === "image" && isPlainObject(part.source)) {
    const source = part.source as Record<string, any>;
    // Checked ahead of the source.type gate on purpose. A string in
    // source.data identifies the image whatever source.type says, so a "data:"
    // URI here is rejected even when source.type was left off - the field in
    // this shape that is easiest to forget. Checking first means the caller
    // finds out before uploading the whole payload.
    if (typeof source.data === "string" && DATA_URI_PREFIX.test(source.data)) {
      throw errors.invalidParameter(
        "content",
        `item ${index}: image source.data must be raw base64 without a "data:" prefix`
      );
    }
    if (source.type !== "base64") {
      // url-origin images are stored and returned verbatim, so there is
      // nothing for the SDK to validate locally.
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
      // A genuine remote URL. Stored and returned verbatim, so there is
      // nothing to validate locally.
      return;
    }
    const dataUri = parseBase64DataUri(url);
    if (!dataUri) {
      // A data URI that never claimed to be base64: no `;base64` parameter, so
      // the payload is literal or percent-encoded. `data:image/svg+xml,%3Csvg
      // .../%3E` is the everyday example, `data:image/gif,...` the typo.
      //
      // Neither is a malformed image, so neither is rejected. The part is
      // treated as url-origin and stored and returned verbatim, the same as a
      // remote URL.
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
