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
const BASE64_PATTERN = /^[A-Za-z0-9+/\s]+={0,2}$/;
const DATA_URI_PATTERN =
  /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/\s]+={0,2})$/i;

/**
 * Validates the two image spellings DialogueDB recognizes, and only those.
 * Unrecognized blocks pass through exactly as before, the API adds no new
 * rejections, so neither does the SDK.
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
    if (source.data.startsWith("data:")) {
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
    if (!url.startsWith("data:")) {
      return;
    }
    const match = DATA_URI_PATTERN.exec(url);
    if (!match) {
      throw errors.invalidParameter(
        "content",
        `item ${index}: image_url.url is not a well-formed base64 data URI`
      );
    }
    if (SUPPORTED_IMAGE_MEDIA_TYPES.indexOf(match[1].toLowerCase()) === -1) {
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
    if (!content.every((item) => isPlainObject(item))) {
      throw errors.invalidParameter(
        "content",
        "array must contain only objects",
        content
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
