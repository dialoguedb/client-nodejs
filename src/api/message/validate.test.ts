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

    it("accepts a well-formed Anthropic base64 image part", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            { type: "text", text: "what is this?" },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: "iVBORw0KGgoAAAANSUhEUg==",
              },
            },
          ],
        })
      ).not.toThrow();
    });

    it("accepts an Anthropic url image part without inspecting the URL", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image",
              source: { type: "url", url: "https://example.com/a.png" },
            },
          ],
        })
      ).not.toThrow();
    });

    it("accepts a well-formed OpenAI data URI image part", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image_url",
              image_url: {
                url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==",
              },
            },
          ],
        })
      ).not.toThrow();
    });

    it("accepts an OpenAI remote image URL untouched", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image_url",
              image_url: { url: "https://example.com/a.png" },
            },
          ],
        })
      ).not.toThrow();
    });

    it("rejects a non-string image source.data", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/png", data: 123 },
            },
          ],
        } as any)
      ).toThrow("item 0: image source.data must be a non-empty base64 string");
    });

    it("rejects a data: prefix in the Anthropic base64 payload", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: "data:image/png;base64,iVBORw0KGgo=",
              },
            },
          ],
        })
      ).toThrow(
        'item 0: image source.data must be raw base64 without a "data:" prefix'
      );
    });

    it("rejects non-base64 characters in the image payload", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: "not base64!!",
              },
            },
          ],
        })
      ).toThrow("item 0: image source.data is not valid base64");
    });

    it("rejects an unsupported image media type", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            { type: "text", text: "hi" },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/tiff",
                data: "aGVsbG8=",
              },
            },
          ],
        })
      ).toThrow(
        "item 1: image source.media_type must be one of image/jpeg, image/png, image/gif, image/webp"
      );
    });

    it("rejects a malformed data URI on the OpenAI spelling", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image_url",
              image_url: { url: "data:image/png,iVBORw0KGgo=" },
            },
          ],
        })
      ).toThrow("item 0: image_url.url is not a well-formed base64 data URI");
    });

    it("rejects an unsupported media type inside a data URI", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image_url",
              image_url: { url: "data:image/tiff;base64,aGVsbG8=" },
            },
          ],
        })
      ).toThrow(
        "item 0: image_url.url media type must be one of image/jpeg, image/png, image/gif, image/webp"
      );
    });

    it("never echoes the rejected payload back in the error details", () => {
      const payload = "A".repeat(5000);
      try {
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/tiff",
                data: payload,
              },
            },
          ],
        });
        throw new Error("expected validateCreateMessageInput to throw");
      } catch (e) {
        const serialized = JSON.stringify((e as DialogueDBError).details);
        expect(serialized).not.toContain(payload);
      }
    });

    it("leaves unrecognized parts alone", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            { type: "tool_use", id: "call_1", name: "x", input: {} },
            { type: "image", notASource: true },
            { type: "document", source: { type: "base64", data: 42 } },
          ],
        } as any)
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

    it("rejects a whitespace-only base64 payload", () => {
      // \s is inside the allowed character class so that line-wrapped base64
      // passes, which also meant whitespace on its own satisfied the pattern.
      // The length check above cannot catch it either, since "   " is not empty.
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: "   \n  ",
              },
            },
          ],
        } as any)
      ).toThrow("is not valid base64");
    });

    it("rejects a data URI whose payload is only whitespace", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image_url",
              image_url: { url: "data:image/png;base64,    " },
            },
          ],
        } as any)
      ).toThrow("not a well-formed base64 data URI");
    });

    it("still accepts line-wrapped base64", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: "iVBORw0KGgoA\nAAANSUhEUgAA\nAAEAAAAB",
              },
            },
          ],
        } as any)
      ).not.toThrow();
    });

    it("rejects an empty content array", () => {
      expect(() =>
        validateCreateMessageInput({ ...validInput, content: [] } as any)
      ).toThrow("content is required");
    });

    it("does not echo image payloads when the array holds a non-object", () => {
      const payload = "A".repeat(5000);
      try {
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: payload,
              },
            },
            123,
          ],
        } as any);
        throw new Error("expected validateCreateMessageInput to throw");
      } catch (e) {
        expect((e as DialogueDBError).message).toContain(
          "array must contain only objects"
        );
        const serialized = JSON.stringify((e as DialogueDBError).details);
        expect(serialized).not.toContain(payload);
      }
    });
  });

  it.each([
    ["dialogueId type", { ...validInput, dialogueId: 123 }, "must be a string"],
    [
      "dialogueId length",
      { ...validInput, dialogueId: "abc" },
      "must have length of at least 5",
    ],
    ["role type", { ...validInput, role: 123 }, "must be a string"],
    ["id type", { ...validInput, id: 123 }, "must be a string"],
    [
      "id length",
      { ...validInput, id: "abc" },
      "must have length of at least 5",
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
