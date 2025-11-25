import {
  CreateMessageInput,
  GetMessageInput,
  DeleteMessageInput,
  ListMessageFilters,
  InputValidatorResponse,
} from "@/types";
import { isProbablyISOString } from "./validation.utils";

export function isCreateMessageInput(
  input: CreateMessageInput
): InputValidatorResponse {
  // required fields
  if (!input.dialogueId) {
    return [false, "Missing required 'dialogueId'"];
  }
  if (!input.role) {
    return [false, "Missing required 'role'"];
  }
  if (!input.content) {
    return [false, "Missing required 'content'"];
  }

  // validate fields
  if (typeof input.dialogueId !== "string") {
    return [false, "Property 'dialogueId' must be a string"];
  }
  if (input.dialogueId.length <= 4) {
    return [false, "Property 'dialogueId' must have a length greater than 4"];
  }

  if (typeof input.role !== "string") {
    return [false, "Property 'role' must be a string"];
  }
  if (input.role.length < 3) {
    return [false, "Property 'role' must have a length greater than 3"];
  }

  if (input.id) {
    if (typeof input.id !== "string") {
      return [false, "Property 'id' must be a string"];
    }
    if (input.id.length <= 4) {
      return [false, "Property 'id' must have a length greater than 4"];
    }
  }

  if (input.name) {
    if (typeof input.name !== "string") {
      return [false, "Property 'name' must be a string"];
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

export function isGetMessageInput(
  input: GetMessageInput | DeleteMessageInput
): InputValidatorResponse {
  if (!input.dialogueId) {
    return [false, "Missing required 'dialogueId'"];
  }
  if (!input.id) {
    return [false, "Missing required 'id'"];
  }
  return [true];
}

export function isListMessageFilters(
  input: ListMessageFilters
): InputValidatorResponse {
  if (!input.dialogueId) {
    return [false, "Missing required 'dialogueId'"];
  }

  return [true];
}
