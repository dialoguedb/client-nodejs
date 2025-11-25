import {
  CreateDialogueInput,
  GetDialogueInput,
  DeleteDialogueInput,
  ListDialogueFilters,
  InputValidatorResponse,
  UpdateDialogueInput,
} from "@/types";
import { isProbablyISOString } from "./validation.utils";

export function isCreateDialogueInput(
  input: CreateDialogueInput
): InputValidatorResponse {
  if (input.id) {
    if (typeof input.id !== "string") {
      return [false, "Property 'id' must be a string"];
    }
    if (input.id.length <= 4) {
      return [false, "Property 'id' must have a length greater than 4"];
    }
  }

  if (input.namespace) {
    if (typeof input.namespace !== "string") {
      return [false, "Property 'namespace' must be a string"];
    }
    if (input.namespace.length <= 4) {
      return [false, "Property 'namespace' must have a length greater than 4"];
    }
  }

  if (input.tags) {
    if (!Array.isArray(input.tags)) {
      return [false, "Property 'tags' must be an array"];
    }
    if (input.tags.length > 10) {
      return [
        false,
        "Property 'tags' must have a length less than or equal to 10",
      ];
    }
  }

  if (input.metadata) {
    if (
      !input.metadata ||
      typeof input.metadata !== "object" ||
      Array.isArray(input.metadata)
    ) {
      return [false, "Property 'metadata' must be an object"];
    }
  }

  if (input.created) {
    if (typeof input.created !== "string") {
      return [false, "Property 'created' must be a string"];
    }
    if (!isProbablyISOString(input.created)) {
      return [false, "Property 'created' should be an ISO 8601 string"];
    }
  }

  return [true];
}

export function isUpdateDialogueInput(
  input: UpdateDialogueInput
): InputValidatorResponse {
  if (!input.id) {
    return [false, "Missing required 'id'"];
  }

  if (typeof input.id !== "string") {
    return [false, "Property 'id' must be a string"];
  }
  if (input.id.length <= 4) {
    return [false, "Property 'id' must have a length greater than 4"];
  }

  if (input.label) {
    if (typeof input.label !== "string") {
      return [false, "Property 'label' must be a string"];
    }
  }
  return [true];
}

export function isGetDialogueInput(
  input: GetDialogueInput | DeleteDialogueInput
): InputValidatorResponse {
  if (!input.id) {
    return [false, "Missing required 'id'"];
  }
  return [true];
}

export function isListDialogueFilters(
  input: ListDialogueFilters
): InputValidatorResponse {
  if (typeof input.limit !== "undefined") {
    if (
      typeof input.limit !== "string" &&
      typeof input.limit !== "number"
    ) {
      return [false, "Property 'limit' should be a number or string"];
    }
  }

  if (typeof input.order !== "undefined") {
    if (typeof input.order !== "string") {
      return [false, "Property 'order' should be a string"];
    }
    if (!["asc", "desc"].includes(input.order)) {
      return [false, "Property 'order' must be either 'asc' or 'desc'"];
    }
  }

  if (typeof input.next !== "undefined") {
    if (typeof input.next !== "string") {
      return [false, "Property 'next' should be a string"];
    }
  }
  return [true];
}
