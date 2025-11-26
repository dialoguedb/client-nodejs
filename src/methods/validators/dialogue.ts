import { errors } from "@/errors";
import {
  CreateDialogueInput,
  GetDialogueInput,
  DeleteDialogueInput,
  ListDialogueFilters,
  UpdateDialogueInput,
} from "@/types";
import { isProbablyISOString } from "../validation.utils";

/**
 * Validates CreateDialogueInput, throwing DialogueDBError if invalid.
 */
export function validateCreateDialogueInput(input: CreateDialogueInput): void {
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

  if (input.namespace !== undefined) {
    if (typeof input.namespace !== "string") {
      throw errors.invalidParameter(
        "namespace",
        "must be a string",
        input.namespace
      );
    }
    if (input.namespace.length <= 4) {
      throw errors.invalidParameter(
        "namespace",
        "must have length greater than 4",
        input.namespace
      );
    }
  }

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
 * Validates UpdateDialogueInput, throwing DialogueDBError if invalid.
 */
export function validateUpdateDialogueInput(input: UpdateDialogueInput): void {
  if (!input.id) {
    throw errors.missingParameter("id");
  }

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

  if (input.label !== undefined) {
    if (typeof input.label !== "string") {
      throw errors.invalidParameter("label", "must be a string", input.label);
    }
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
}

/**
 * Validates ListDialogueFilters, throwing DialogueDBError if invalid.
 */
export function validateListDialogueFilters(input: ListDialogueFilters): void {
  if (input.limit !== undefined) {
    if (typeof input.limit !== "string" && typeof input.limit !== "number") {
      throw errors.invalidParameter(
        "limit",
        "should be a number or string",
        input.limit
      );
    }
  }

  if (input.order !== undefined) {
    if (typeof input.order !== "string") {
      throw errors.invalidParameter("order", "should be a string", input.order);
    }
    if (!["asc", "desc"].includes(input.order)) {
      throw errors.invalidParameter(
        "order",
        "must be either 'asc' or 'desc'",
        input.order
      );
    }
  }

  if (input.next !== undefined) {
    if (typeof input.next !== "string") {
      throw errors.invalidParameter("next", "should be a string", input.next);
    }
  }
}
