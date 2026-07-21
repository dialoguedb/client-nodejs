import { DialogueDBError } from "@/errors";
import {
  validateCreateMessageInput,
  validateGetMessageInput,
  validateListMessageFilters,
} from "./validate";

describe("validateCreateMessageInput", () => {
  const validInput = {
    dialogueId: "dialogue-123",
    role: "user",
    content: "Hello",
  };

  it("accepts valid minimal input", () => {
    expect(() => validateCreateMessageInput(validInput)).not.toThrow();
  });

  it("accepts valid complete input", () => {
    expect(() =>
      validateCreateMessageInput({
        ...validInput,
        id: "message-123",
        name: "User Name",
        tags: ["tag1"],
        metadata: { key: "value" },
        created: "2024-01-01T00:00:00.000Z",
      })
    ).not.toThrow();
  });

  describe("required fields", () => {
    it.each([
      ["dialogueId", { role: "user", content: "Hello" }],
      ["role", { dialogueId: "dialogue-123", content: "Hello" }],
      ["content", { dialogueId: "dialogue-123", role: "user" }],
    ])("requires %s", (field, input) => {
      expect(() => validateCreateMessageInput(input as any)).toThrow(
        `${field} is required`
      );
      expect(() => validateCreateMessageInput(input as any)).toThrow(
        DialogueDBError
      );
    });
  });

  describe("content validation", () => {
    it("accepts string content", () => {
      expect(() =>
        validateCreateMessageInput({ ...validInput, content: "text" })
      ).not.toThrow();
    });

    it("accepts plain object content", () => {
      expect(() =>
        validateCreateMessageInput({ ...validInput, content: { type: "json" } })
      ).not.toThrow();
    });

    it("accepts array of plain objects", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [{ type: "text" }, { type: "image" }],
        })
      ).not.toThrow();
    });

    it("rejects Date object", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: new Date(),
        } as any)
      ).toThrow("must be a string, object, or array of objects");
    });

    it("rejects array with non-objects", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: ["string", 123],
        } as any)
      ).toThrow("array must contain only objects");
    });

    it("rejects empty string", () => {
      expect(() =>
        validateCreateMessageInput({ ...validInput, content: "" })
      ).toThrow("content is required");
    });

    it("rejects null", () => {
      expect(() =>
        validateCreateMessageInput({ ...validInput, content: null } as any)
      ).toThrow("content is required");
    });
  });

  it.each([
    ["dialogueId type", { ...validInput, dialogueId: 123 }, "must be a string"],
    [
      "dialogueId length",
      { ...validInput, dialogueId: "" },
      "is required",
    ],
    ["role type", { ...validInput, role: 123 }, "must be a string"],
    ["id type", { ...validInput, id: 123 }, "must be a string"],
    [
      "id length",
      { ...validInput, id: "" },
      "must have length of at least 1",
    ],
    ["name type", { ...validInput, name: 123 }, "must be a string"],
    ["tags type", { ...validInput, tags: "not-array" }, "must be an array"],
    [
      "tags count",
      { ...validInput, tags: Array(11).fill("t") },
      "must have 10 or fewer items",
    ],
    [
      "tags contents",
      { ...validInput, tags: [123] },
      "must contain only strings",
    ],
    ["metadata type", { ...validInput, metadata: null }, "must be an object"],
    ["created type", { ...validInput, created: 123 }, "must be a string"],
    [
      "created format",
      { ...validInput, created: "invalid" },
      "must be an ISO 8601 string",
    ],
  ])("rejects invalid %s", (_, input, expectedError) => {
    expect(() => validateCreateMessageInput(input as any)).toThrow(
      expectedError
    );
  });
});

describe("validateGetMessageInput", () => {
  it("requires dialogueId", () => {
    expect(() => validateGetMessageInput({ id: "msg-123" } as any)).toThrow(
      "dialogueId is required"
    );
  });

  it("requires id", () => {
    expect(() =>
      validateGetMessageInput({ dialogueId: "dlg-123" } as any)
    ).toThrow("id is required");
  });

  it("validates field types", () => {
    expect(() =>
      validateGetMessageInput({ dialogueId: 123, id: "msg" } as any)
    ).toThrow("must be a string");
    expect(() =>
      validateGetMessageInput({ dialogueId: "dlg", id: 123 } as any)
    ).toThrow("must be a string");
  });

  it("accepts valid input", () => {
    expect(() =>
      validateGetMessageInput({ dialogueId: "dlg-123", id: "msg-123" })
    ).not.toThrow();
  });
});

describe("validateListMessageFilters", () => {
  it("requires dialogueId", () => {
    expect(() => validateListMessageFilters({} as any)).toThrow(
      "dialogueId is required"
    );
  });

  it("accepts valid minimal input", () => {
    expect(() =>
      validateListMessageFilters({ dialogueId: "dlg-123" })
    ).not.toThrow();
  });

  it("accepts valid complete input", () => {
    expect(() =>
      validateListMessageFilters({
        dialogueId: "dlg-123",
        limit: 10,
        order: "desc",
        next: "token",
      })
    ).not.toThrow();
  });

  it.each([
    [
      "limit type",
      { dialogueId: "dlg-123", limit: "10" },
      "must be a positive integer",
    ],
    [
      "limit negative",
      { dialogueId: "dlg-123", limit: -1 },
      "must be a positive integer",
    ],
    [
      "limit zero",
      { dialogueId: "dlg-123", limit: 0 },
      "must be a positive integer",
    ],
    [
      "limit float",
      { dialogueId: "dlg-123", limit: 1.5 },
      "must be a positive integer",
    ],
    [
      "order invalid",
      { dialogueId: "dlg-123", order: "bad" },
      "must be 'asc' or 'desc'",
    ],
    ["next type", { dialogueId: "dlg-123", next: 123 }, "must be a string"],
  ])("rejects invalid %s", (_, input, expectedError) => {
    expect(() => validateListMessageFilters(input as any)).toThrow(
      expectedError
    );
  });
});
