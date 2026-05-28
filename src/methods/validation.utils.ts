import { errors } from "@/errors";

// Checks if string looks like an ISO date (YYYY-MM-DD...)
export function isProbablyISOString(str: string) {
  return (
    typeof str === "string" &&
    str.length >= 10 &&
    /^\d{4}-\d{2}-\d{2}/.test(str)
  );
}

export function validateStringField(
  value: unknown,
  field: string,
  minLength?: number
): void {
  if (typeof value !== "string") {
    throw errors.invalidParameter(field, "must be a string", value);
  }
  if (minLength !== undefined && value.length < minLength) {
    throw errors.invalidParameter(
      field,
      `must have length of at least ${minLength}`,
      value
    );
  }
}

export function validateTagsField(tags: unknown): void {
  if (!Array.isArray(tags)) {
    throw errors.invalidParameter("tags", "must be an array", tags);
  }
  if (tags.length > 10) {
    throw errors.invalidParameter("tags", "must have 10 or fewer items", tags);
  }
  if (!tags.every((t) => typeof t === "string")) {
    throw errors.invalidParameter("tags", "must contain only strings", tags);
  }
}

export function validateMetadataField(metadata: unknown): void {
  if (
    typeof metadata !== "object" ||
    metadata === null ||
    Array.isArray(metadata)
  ) {
    throw errors.invalidParameter("metadata", "must be an object", metadata);
  }
}

export function validateStateField(state: unknown): void {
  if (typeof state !== "object" || state === null || Array.isArray(state)) {
    throw errors.invalidParameter("state", "must be an object", state);
  }
}

export function validateCreatedField(created: unknown): void {
  if (typeof created !== "string") {
    throw errors.invalidParameter("created", "must be a string", created);
  }
  if (!isProbablyISOString(created)) {
    throw errors.invalidParameter(
      "created",
      "must be an ISO 8601 string",
      created
    );
  }
}

export function validateOrderField(order: unknown, field = "order"): void {
  if (order !== "asc" && order !== "desc") {
    throw errors.invalidParameter(field, "must be 'asc' or 'desc'", order);
  }
}

export function validatePositiveIntField(value: unknown, field: string): void {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw errors.invalidParameter(field, "must be a positive integer", value);
  }
}

export function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
