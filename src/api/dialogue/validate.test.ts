import { DialogueDBError } from "@/errors";
import {
  validateCreateDialogueInput,
  validateUpdateDialogueInput,
  validateGetDialogueInput,
  validateListDialogueFilters,
} from "./validate";

describe("validateCreateDialogueInput", () => {
  it("accepts empty input", () => {
    expect(() => validateCreateDialogueInput({})).not.toThrow();
  });

  it("accepts valid complete input", () => {
    expect(() =>
      validateCreateDialogueInput({
        id: "custom-dialogue-id",
        namespace: "my-namespace",
        threadOf: "parent-123",
        label: "Test",
        tags: ["tag1", "tag2"],
        metadata: { key: "value" },
        state: { step: 1 },
        created: "2024-01-01T00:00:00.000Z",
      })
    ).not.toThrow();
  });

  it.each([
    ["id", { id: 123 }, "must be a string"],
    ["namespace", { namespace: 123 }, "must be a string"],
    ["namespace", { namespace: "" }, "must have length of at least 1"],
    ["threadOf", { threadOf: 123 }, "must be a string"],
    ["threadOf", { threadOf: "" }, "must have length of at least 1"],
    ["label", { label: 123 }, "must be a string"],
    ["tags", { tags: "not-array" }, "must be an array"],
    ["tags", { tags: Array(11).fill("t") }, "must have 10 or fewer items"],
    ["tags", { tags: ["valid", 123] }, "must contain only strings"],
    ["metadata", { metadata: null }, "must be an object"],
    ["metadata", { metadata: [] }, "must be an object"],
    ["metadata", { metadata: "string" }, "must be an object"],
    ["state", { state: null }, "must be an object"],
    ["state", { state: [] }, "must be an object"],
    ["created", { created: 123 }, "must be a string"],
    ["created", { created: "not-a-date" }, "must be an ISO 8601 string"],
  ])("rejects invalid %s: %s", (_, input, expectedError) => {
    expect(() => validateCreateDialogueInput(input as any)).toThrow(
      expectedError
    );
    expect(() => validateCreateDialogueInput(input as any)).toThrow(
      DialogueDBError
    );
  });
});

describe("validateUpdateDialogueInput", () => {
  it("requires id", () => {
    expect(() => validateUpdateDialogueInput({} as any)).toThrow(
      "id is required"
    );
  });

  it("accepts valid input", () => {
    expect(() =>
      validateUpdateDialogueInput({
        id: "dialogue-123",
        label: "New label",
        tags: ["tag1"],
        state: { updated: true },
      })
    ).not.toThrow();
  });

  it.each([
    ["id type", { id: 123 }, "must be a string"],
    ["id empty", { id: "" }, "is required"],
    ["label", { id: "valid-id", label: 123 }, "must be a string"],
    ["tags", { id: "valid-id", tags: "not-array" }, "must be an array"],
    ["state", { id: "valid-id", state: null }, "must be an object"],
  ])("rejects invalid %s", (_, input, expectedError) => {
    expect(() => validateUpdateDialogueInput(input as any)).toThrow(
      expectedError
    );
  });
});

describe("validateGetDialogueInput", () => {
  it("requires id", () => {
    expect(() => validateGetDialogueInput({} as any)).toThrow("id is required");
  });

  it("validates id is string", () => {
    expect(() => validateGetDialogueInput({ id: 123 as any })).toThrow(
      "must be a string"
    );
  });

  it("accepts valid input", () => {
    expect(() =>
      validateGetDialogueInput({ id: "dialogue-123" })
    ).not.toThrow();
  });
});

describe("validateListDialogueFilters", () => {
  it("accepts empty filters", () => {
    expect(() => validateListDialogueFilters({})).not.toThrow();
  });

  it("accepts valid complete filters", () => {
    expect(() =>
      validateListDialogueFilters({
        limit: 10,
        order: "desc",
        next: "token",
        namespace: "my-namespace",
        threadOf: "parent-123",
      })
    ).not.toThrow();
  });

  it.each([
    ["limit type", { limit: "10" }, "must be a positive integer"],
    ["limit negative", { limit: -1 }, "must be a positive integer"],
    ["limit zero", { limit: 0 }, "must be a positive integer"],
    ["limit float", { limit: 1.5 }, "must be a positive integer"],
    ["order invalid", { order: "invalid" }, "must be 'asc' or 'desc'"],
    ["next type", { next: 123 }, "must be a string"],
    ["namespace type", { namespace: 123 }, "must be a string"],
    ["threadOf type", { threadOf: 123 }, "must be a string"],
  ])("rejects invalid %s", (_, input, expectedError) => {
    expect(() => validateListDialogueFilters(input as any)).toThrow(
      expectedError
    );
  });

  it.each(["asc", "desc"] as const)("accepts order '%s'", (order) => {
    expect(() => validateListDialogueFilters({ order })).not.toThrow();
  });
});
