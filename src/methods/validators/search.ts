import { errors } from "@/errors";
import { SearchInput } from "@/api/search";
import {
  isObjectLike,
  validateOrderField,
  validatePositiveIntField,
  validateStringField,
} from "../validation.utils";

const SEARCH_OBJECTS = ["message", "dialogue", "memory"] as const;
const ORDER_BY_VALUES = ["relevance", "created", "modified"] as const;

const DEPRECATED_DATE_KEYS = [
  "createdYear",
  "createdMonth",
  "createdDay",
  "createdTimestamp",
  "modifiedYear",
  "modifiedMonth",
  "modifiedDay",
  "modifiedTimestamp",
] as const;

const TAG_OPERATORS = ["$in", "$all", "$nin"] as const;

const METADATA_OPERATORS = [
  "$eq",
  "$ne",
  "$in",
  "$nin",
  "$gt",
  "$gte",
  "$lt",
  "$lte",
] as const;

const DATE_RANGE_KEYS = ["gte", "gt", "lte", "lt"] as const;

function rejectDeprecatedFilterKeys(filter: Record<string, unknown>): void {
  for (const key of DEPRECATED_DATE_KEYS) {
    if (key in filter) {
      const replacement = key.startsWith("created")
        ? "filter.created"
        : "filter.modified";
      throw errors.invalidParameter(
        `filter.${key}`,
        `is no longer supported — use ${replacement}: { gte, lt } with ISO 8601 strings, or a natural-language phrase like "March 2025"`,
        (filter as Record<string, unknown>)[key]
      );
    }
  }
}

function validateTagArray(field: string, arr: unknown): void {
  if (!Array.isArray(arr)) {
    throw errors.invalidParameter(
      field,
      "must be an array of non-empty strings",
      arr
    );
  }
  if (arr.length === 0) {
    throw errors.invalidParameter(field, "must not be empty", arr);
  }
  if (!arr.every((v) => typeof v === "string" && v.length > 0)) {
    throw errors.invalidParameter(
      field,
      "must contain only non-empty strings",
      arr
    );
  }
}

function validateTagsValue(value: unknown): void {
  if (Array.isArray(value)) {
    validateTagArray("tags", value);
    return;
  }

  if (!isObjectLike(value)) {
    throw errors.invalidParameter(
      "tags",
      "must be a string array or an operator object ({ $in, $all, $nin })",
      value
    );
  }

  const keys = Object.keys(value);
  if (keys.length === 0) {
    throw errors.invalidParameter(
      "tags",
      "operator object must have at least one of $in, $all, $nin",
      value
    );
  }

  for (const key of keys) {
    if (!TAG_OPERATORS.includes(key as (typeof TAG_OPERATORS)[number])) {
      throw errors.invalidParameter(
        `tags.${key}`,
        `unknown tag operator — allowed: ${TAG_OPERATORS.join(", ")}`,
        key
      );
    }
    validateTagArray(`tags.${key}`, (value as Record<string, unknown>)[key]);
  }
}

function validateDateFilterValue(field: string, value: unknown): void {
  if (typeof value === "string") return;

  if (!isObjectLike(value)) {
    throw errors.invalidParameter(
      field,
      "must be a string (ISO 8601 or natural-language phrase) or a range object ({ gte, gt, lte, lt })",
      value
    );
  }

  const keys = Object.keys(value);
  if (keys.length === 0) {
    throw errors.invalidParameter(
      field,
      "range object must have at least one of gte, gt, lte, lt",
      value
    );
  }

  for (const key of keys) {
    if (!DATE_RANGE_KEYS.includes(key as (typeof DATE_RANGE_KEYS)[number])) {
      throw errors.invalidParameter(
        `${field}.${key}`,
        `unknown range key — allowed: ${DATE_RANGE_KEYS.join(", ")}`,
        key
      );
    }
    const bound = (value as Record<string, unknown>)[key];
    if (typeof bound !== "string") {
      throw errors.invalidParameter(
        `${field}.${key}`,
        "must be a string",
        bound
      );
    }
  }
}

function validateFilter(filter: unknown): void {
  if (!isObjectLike(filter)) {
    throw errors.invalidParameter("filter", "must be an object", filter);
  }

  rejectDeprecatedFilterKeys(filter);

  for (const key of Object.keys(filter)) {
    if (key !== "created" && key !== "modified") {
      throw errors.invalidParameter(
        `filter.${key}`,
        "unknown filter key — allowed: created, modified",
        key
      );
    }
    validateDateFilterValue(`filter.${key}`, filter[key]);
  }
}

function isMetadataPrimitive(v: unknown): v is string | number | boolean {
  return (
    typeof v === "string" || typeof v === "number" || typeof v === "boolean"
  );
}

function validateMetadataPrimitiveArray(field: string, arr: unknown[]): void {
  if (arr.length === 0) {
    throw errors.invalidParameter(field, "must be a non-empty array", arr);
  }
  if (!isMetadataPrimitive(arr[0])) {
    throw errors.invalidParameter(
      field,
      "must contain only strings, numbers, or booleans",
      arr
    );
  }
  const firstType = typeof arr[0];
  if (!arr.every((v) => typeof v === firstType && isMetadataPrimitive(v))) {
    throw errors.invalidParameter(
      field,
      "array must contain values of a single primitive type (string, number, or boolean)",
      arr
    );
  }
}

function validateMetadataOperatorObject(
  field: string,
  value: Record<string, unknown>
): void {
  const keys = Object.keys(value);
  if (keys.length === 0) {
    throw errors.invalidParameter(
      field,
      "operator object must have at least one operator",
      value
    );
  }

  for (const key of keys) {
    if (
      !METADATA_OPERATORS.includes(key as (typeof METADATA_OPERATORS)[number])
    ) {
      throw errors.invalidParameter(
        `${field}.${key}`,
        `unknown metadata operator — allowed: ${METADATA_OPERATORS.join(", ")}`,
        key
      );
    }

    const operand = value[key];
    if (key === "$in" || key === "$nin") {
      if (!Array.isArray(operand)) {
        throw errors.invalidParameter(
          `${field}.${key}`,
          "must be a non-empty array",
          operand
        );
      }
      validateMetadataPrimitiveArray(`${field}.${key}`, operand);
    }
  }
}

function validateMetadata(metadata: unknown): void {
  if (!isObjectLike(metadata)) {
    throw errors.invalidParameter("metadata", "must be an object", metadata);
  }

  for (const [field, value] of Object.entries(metadata)) {
    const path = `metadata.${field}`;
    if (isMetadataPrimitive(value)) {
      continue;
    }
    if (Array.isArray(value)) {
      validateMetadataPrimitiveArray(path, value);
      continue;
    }
    if (isObjectLike(value)) {
      validateMetadataOperatorObject(path, value);
      continue;
    }
    throw errors.invalidParameter(
      path,
      "must be a primitive, array of primitives, or operator object",
      value
    );
  }
}

/**
 * Validates the new search request shape at the SDK boundary.
 *
 * Catches deprecated date-decomposition fields with a migration hint and
 * obvious shape errors. The server remains the source of truth for full
 * operator/date parsing.
 */
export function validateSearchInput(input: SearchInput): void {
  if (input === null || typeof input !== "object") {
    throw errors.invalidParameter("input", "must be an object", input);
  }

  validateStringField(input.query, "query", 1);

  if (
    !SEARCH_OBJECTS.includes(input.object as (typeof SEARCH_OBJECTS)[number])
  ) {
    throw errors.invalidParameter(
      "object",
      `must be one of ${SEARCH_OBJECTS.join(", ")}`,
      input.object
    );
  }

  if (input.limit !== undefined) {
    validatePositiveIntField(input.limit, "limit");
  }

  if (input.namespace !== undefined) {
    validateStringField(input.namespace, "namespace");
  }

  if (input.timezone !== undefined) {
    validateStringField(input.timezone, "timezone", 1);
  }

  if (input.order !== undefined) {
    validateOrderField(input.order);
  }

  if (input.orderBy !== undefined) {
    if (
      !ORDER_BY_VALUES.includes(
        input.orderBy as (typeof ORDER_BY_VALUES)[number]
      )
    ) {
      throw errors.invalidParameter(
        "orderBy",
        `must be one of ${ORDER_BY_VALUES.join(", ")}`,
        input.orderBy
      );
    }
  }

  if (input.tags !== undefined) {
    validateTagsValue(input.tags);
  }

  if (input.filter !== undefined) {
    validateFilter(input.filter);
  }

  if (input.metadata !== undefined) {
    validateMetadata(input.metadata);
  }
}
