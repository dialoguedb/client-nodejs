import { errors } from "@/errors";
import {
  CreateMessageInput,
  GetMessageInput,
  DeleteMessageInput,
  ListMessageFilters,
} from "@/types";
import { isProbablyISOString } from "../validation.utils";

/**
 * Validates CreateMessageInput, throwing DialogueDBError if invalid.
 */
export function validateCreateMessageInput(input: CreateMessageInput): void {
  // Required fields
  if (!input.dialogueId) {
    throw errors.missingParameter("dialogueId");
  }
  if (!input.role) {
    throw errors.missingParameter("role");
  }
  if (!input.content) {
    throw errors.missingParameter("content");
  }

  // Validate dialogueId
  if (typeof input.dialogueId !== "string") {
    throw errors.invalidParameter(
      "dialogueId",
      "must be a string",
      input.dialogueId
    );
  }
  if (input.dialogueId.length <= 4) {
    throw errors.invalidParameter(
      "dialogueId",
      "must have length greater than 4",
      input.dialogueId
    );
  }

  // Validate role
  if (typeof input.role !== "string") {
    throw errors.invalidParameter("role", "must be a string", input.role);
  }
  if (input.role.length < 3) {
    throw errors.invalidParameter(
      "role",
      "must have length greater than 3",
      input.role
    );
  }

  // Optional id
  if (input.id !== undefined) {
    if (typeof input.id !== "string") {
      throw errors.invalidParameter("id", "must be a string", input.id);
    }
    if (input.id.length <= 4) {
      throw errors.invalidParameter(
        "id",
        "must have length greater than 4",
        input.id
      );
    }
  }

  // Optional name
  if (input.name !== undefined) {
    if (typeof input.name !== "string") {
      throw errors.invalidParameter("name", "must be a string", input.name);
    }
  }

  // Optional tags
  if (input.tags !== undefined) {
    if (!Array.isArray(input.tags)) {
      throw errors.invalidParameter("tags", "must be an array", input.tags);
    }
    if (input.tags.length > 10) {
      throw errors.invalidParameter(
        "tags",
        "must have length less than or equal to 10",
        input.tags
      );
    }
  }

  // Optional metadata
  if (input.metadata !== undefined) {
    if (
      typeof input.metadata !== "object" ||
      input.metadata === null ||
      Array.isArray(input.metadata)
    ) {
      throw errors.invalidParameter(
        "metadata",
        "must be an object",
        input.metadata
      );
    }
  }

  // Optional created
  if (input.created !== undefined) {
    if (typeof input.created !== "string") {
      throw errors.invalidParameter(
        "created",
        "must be a string",
        input.created
      );
    }
    if (!isProbablyISOString(input.created)) {
      throw errors.invalidParameter(
        "created",
        "should be an ISO 8601 string",
        input.created
      );
    }
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
  if (!input.id) {
    throw errors.missingParameter("id");
  }
}

/**
 * Validates ListMessageFilters, throwing DialogueDBError if invalid.
 */
export function validateListMessageFilters(input: ListMessageFilters): void {
  if (!input.dialogueId) {
    throw errors.missingParameter("dialogueId");
  }
}
