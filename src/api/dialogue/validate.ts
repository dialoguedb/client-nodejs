import { errors } from "@/errors";
import {
  CreateDialogueInput,
  GetDialogueInput,
  DeleteDialogueInput,
  ListDialogueFilters,
  UpdateDialogueInput,
} from "@/types";
import {
  validateStringField,
  validateTagsField,
  validateMetadataField,
  validateStateField,
  validateCreatedField,
} from "@/utils/validation";

/**
 * Validates CreateDialogueInput, throwing DialogueDBError if invalid.
 */
export function validateCreateDialogueInput(input: CreateDialogueInput): void {
  if (input.id !== undefined) {
    validateStringField(input.id, "id");
  }

  if (input.namespace !== undefined) {
    validateStringField(input.namespace, "namespace", 1);
  }

  if (input.threadOf !== undefined) {
    validateStringField(input.threadOf, "threadOf", 1);
  }

  if (input.label !== undefined) {
    validateStringField(input.label, "label");
  }

  if (input.tags !== undefined) {
    validateTagsField(input.tags);
  }

  if (input.metadata !== undefined) {
    validateMetadataField(input.metadata);
  }

  if (input.state !== undefined) {
    validateStateField(input.state);
  }

  if (input.created !== undefined) {
    validateCreatedField(input.created);
  }
}

/**
 * Validates UpdateDialogueInput, throwing DialogueDBError if invalid.
 */
export function validateUpdateDialogueInput(input: UpdateDialogueInput): void {
  if (!input.id) {
    throw errors.missingParameter("id");
  }
  validateStringField(input.id, "id", 1);

  if (input.label !== undefined) {
    validateStringField(input.label, "label");
  }

  if (input.tags !== undefined) {
    validateTagsField(input.tags);
  }

  if (input.state !== undefined) {
    validateStateField(input.state);
  }
}

/**
 * Validates GetDialogueInput or DeleteDialogueInput, throwing DialogueDBError if invalid.
 */
export function validateGetDialogueInput(
  input: GetDialogueInput | DeleteDialogueInput
): void {
  if (!input.id) {
    throw errors.missingParameter("id");
  }
  validateStringField(input.id, "id");
}

/**
 * Validates ListDialogueFilters, throwing DialogueDBError if invalid.
 */
export function validateListDialogueFilters(input: ListDialogueFilters): void {
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

  if (input.namespace !== undefined) {
    validateStringField(input.namespace, "namespace");
  }

  if (input.threadOf !== undefined) {
    validateStringField(input.threadOf, "threadOf");
  }
}
