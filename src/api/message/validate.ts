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

// Whitespace is allowed: line-wrapped base64 is common in copied payloads.
// The leading lookahead is what stops whitespace ALONE from qualifying: `\s`
// inside the class satisfies the `+` on its own, so "   " would otherwise read
// as a valid payload and the length check above cannot catch it. The trailing
// `\s*` matters for the same population: base64 read from a file usually ends
// with a newline, and anchoring `$` right after the padding rejected exactly
// the line-wrapped payloads this pattern exists to accept.
const BASE64_PATTERN = /^(?=\s*[A-Za-z0-9+/])[A-Za-z0-9+/\s]+={0,2}\s*$/;

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
 *   prefix could not be restored on read and content is write-once.
 * - data URI shape in `image_url.url`: parsed exactly as the API parses it, so
 *   the two agree on what is a base64 data URI. See DATA_URI_PATTERN.
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
function validateImagePart(part: Record<string, any>, index: number): void {
  if (part.type === "image" && isPlainObject(part.source)) {
    const source = part.source as Record<string, any>;
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
    if (DATA_URI_PREFIX.test(source.data)) {
      throw errors.invalidParameter(
        "content",
        `item ${index}: image source.data must be raw base64 without a "data:" prefix`
      );
    }
    if (!BASE64_PATTERN.test(source.data)) {
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
    if (!dataUri || !BASE64_PATTERN.test(dataUri.base64)) {
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
