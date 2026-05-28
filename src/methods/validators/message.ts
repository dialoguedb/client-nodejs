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
    return;
  }
  if (!isPlainObject(content)) {
    throw errors.invalidParameter(
      "content",
      "must be a string, object, or array of objects",
      content
    );
  }
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
