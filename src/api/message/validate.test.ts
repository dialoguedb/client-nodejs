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

    // A `data:` URI in `source.data` is rejected whatever `source.type` says,
    // and when it is missing entirely. The server rejects the same payload, so
    // catching it locally saves uploading the image first.
    it.each([
      ["source.type is omitted", { media_type: "image/png" }],
      ["source.type says url", { type: "url", media_type: "image/png" }],
      ["there is no media_type either", {}],
    ])("rejects a data: prefix in source.data when %s", (_, source) => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image",
              source: { ...source, data: "data:image/png;base64,iVBORw0KGgo=" },
            },
          ],
        } as any)
      ).toThrow(
        'item 0: image source.data must be raw base64 without a "data:" prefix'
      );
    });

    it("still leaves a url source with no data field alone", () => {
      // An image referenced by URL is stored and returned exactly as given, so
      // the SDK does not inspect the URL or its media type.
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image",
              source: {
                type: "url",
                url: "https://example.com/a.tiff",
                media_type: "image/tiff",
              },
            },
          ],
        } as any)
      ).not.toThrow();
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

    // A data URI with no `;base64` parameter is not broken base64, it is a
    // different kind of part: it is accepted and stored exactly as sent, so the
    // SDK must not reject it as a malformed base64 URI.
    it.each([
      ["an inline SVG", "data:image/svg+xml,%3Csvg viewBox='0 0 1 1'/%3E"],
      ["a percent-encoded payload", "data:image/gif,%89PNG"],
      ["a literal payload", "data:image/png,iVBORw0KGgo="],
      ["a media type outside the allowlist", "data:image/tiff,MM%00%2A"],
    ])("accepts %s data URI the API stores verbatim", (_, url) => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [{ type: "image_url", image_url: { url } }],
        })
      ).not.toThrow();
    });

    it("still rejects a data URI that declares base64 and is not", () => {
      // A data URI that declares `;base64` still has its payload validated.
      // Only URIs without that parameter are passed through unchecked.
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image_url",
              image_url: { url: "data:image/png;base64,iVBORw0KGgo!" },
            },
          ],
        })
      ).toThrow("item 0: image_url.url is not a well-formed base64 data URI");
    });

    // RFC 2397 is `data:[<mediatype>][;<parameter>]*[;base64],<data>`: the
    // media type is optional and any number of parameters may precede
    // `;base64`. Both forms below are well-formed data URIs, so the SDK
    // accepts them and they are stored and returned byte for byte.
    it("accepts a data URI carrying parameters besides base64", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image_url",
              image_url: {
                url: "data:image/png;charset=utf-8;base64,iVBORw0KGgo=",
              },
            },
          ],
        })
      ).not.toThrow();
    });

    it("accepts a data URI with the media type omitted", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image_url",
              image_url: { url: "data:;base64,iVBORw0KGgo=" },
            },
          ],
        })
      ).not.toThrow();
    });

    it("accepts an uppercase base64 parameter", () => {
      // The `;base64` parameter is case-insensitive, like the scheme itself:
      // ";BASE64" declares the same encoding.
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image_url",
              image_url: { url: "DATA:image/png;BASE64,iVBORw0KGgo=" },
            },
          ],
        })
      ).not.toThrow();
    });

    it("still rejects a data URI whose payload is not base64", () => {
      // The accepted URI shape is permissive, but the payload after
      // `;base64,` must still be valid base64.
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image_url",
              image_url: { url: "data:image/png;base64,not base64!!" },
            },
          ],
        })
      ).toThrow("item 0: image_url.url is not a well-formed base64 data URI");
    });

    it("still rejects an unsupported media type declared with extra parameters", () => {
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image_url",
              image_url: {
                url: "data:image/tiff;charset=utf-8;base64,aGVsbG8=",
              },
            },
          ],
        })
      ).toThrow(
        "item 0: image_url.url media type must be one of image/jpeg, image/png, image/gif, image/webp"
      );
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
      // Whitespace is allowed inside a payload so that line-wrapped base64
      // passes, but a payload made only of whitespace is not valid base64.
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

    it("accepts a payload with a trailing newline after the padding", () => {
      // Base64 read from a file usually ends with a newline, so trailing
      // whitespace after the padding is accepted.
      expect(() =>
        validateCreateMessageInput({
          ...validInput,
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: "iVBORw0KGgoAAAANSUhEUg==\n",
              },
            },
          ],
        } as any)
      ).not.toThrow();
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

    it("rejects a mangled payload in bounded time instead of hanging", () => {
      // `source.data` can carry up to 25 MB of caller-supplied text, and
      // validation runs on the caller's thread. A malformed payload of that
      // size has to fail fast rather than stall the call, so this asserts a
      // budget generously above the ~1 ms the check actually takes.
      const mangled = {
        ...validInput,
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: `iVBORw0KGgo${" ".repeat(200_000)}!`,
            },
          },
        ],
      };

      const startedAt = process.hrtime.bigint();
      expect(() => validateCreateMessageInput(mangled as any)).toThrow(
        "is not valid base64"
      );
      const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

      expect(elapsedMs).toBeLessThan(1500);
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

describe("data URI scheme casing", () => {
  // RFC 2397 makes the URI scheme case-insensitive, so "DATA:" and "Data:" are
  // validated exactly like "data:".
  const base = { dialogueId: "dialogue-123", role: "user" as const };
  const payload = "/9j/4AAQSkZJRgABAQ==";
  const withContent = (content: unknown[]) => ({ ...base, content });

  it.each(["DATA", "Data", "dAtA"])(
    "validates the media type of a %s: URI instead of skipping it",
    (scheme) => {
      expect(() =>
        validateCreateMessageInput(
          withContent([
            {
              type: "image_url",
              image_url: { url: `${scheme}:image/tiff;base64,${payload}` },
            },
          ])
        )
      ).toThrow(/media type must be one of/);
    }
  );

  it.each(["DATA", "Data"])(
    "rejects a malformed %s: URI instead of passing it through",
    (scheme) => {
      expect(() =>
        validateCreateMessageInput(
          withContent([
            {
              type: "image_url",
              image_url: { url: `${scheme}:image/png;base64,!!!!` },
            },
          ])
        )
      ).toThrow(/well-formed base64 data URI/);
    }
  );

  it.each(["DATA", "Data"])("accepts a well-formed %s: URI", (scheme) => {
    expect(() =>
      validateCreateMessageInput(
        withContent([
          {
            type: "image_url",
            image_url: { url: `${scheme}:image/jpeg;base64,${payload}` },
          },
        ])
      )
    ).not.toThrow();
  });

  it("names the real problem when source.data carries an uppercase prefix", () => {
    // An uppercase "DATA:" prefix gets the same specific error as a lowercase
    // one, rather than the generic "not valid base64" that a stray ":" would
    // otherwise produce.
    expect(() =>
      validateCreateMessageInput(
        withContent([
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: `DATA:image/png;base64,${payload}`,
            },
          },
        ])
      )
    ).toThrow(/must be raw base64 without a "data:" prefix/);
  });

  it("still leaves a genuine remote url unvalidated", () => {
    expect(() =>
      validateCreateMessageInput(
        withContent([
          {
            type: "image_url",
            image_url: { url: "https://cdn.example.com/a.tiff" },
          },
        ])
      )
    ).not.toThrow();
  });
});

describe("aggregate inline image size", () => {
  const base = { dialogueId: "dialogue-123", role: "user" as const };
  /** Base64 of roughly `mib` mebibytes of decoded bytes. */
  const payload = (mib: number) =>
    "A".repeat(Math.ceil(((mib * 1024 * 1024) / 3) * 4));

  const anthropic = (data: string) => ({
    type: "image",
    source: { type: "base64", media_type: "image/png", data },
  });

  it("rejects two images that are each within plan but cannot share a request", () => {
    // The per-image cap (25 MB) and the per-message part-count cap (20) are
    // independent limits, not a combined budget, so two 20 MB images sit inside
    // both and still exceed the request size limit. Without this local check the
    // caller pays to upload the whole body and gets back a bare 413 that names
    // no image.
    expect(() =>
      validateCreateMessageInput({
        ...base,
        content: [anthropic(payload(20)), anthropic(payload(20))],
      })
    ).toThrow(/over the .* request limit/);
  });

  it("names the workaround that actually works", () => {
    // Telling the caller to "send a smaller image" is wrong: each image is
    // already within the per-image cap. The only fixes are fewer parts or a
    // URL, and the error has to say so or the reader will shrink an image that
    // was never the problem.
    let message = "";
    try {
      validateCreateMessageInput({
        ...base,
        content: [anthropic(payload(20)), anthropic(payload(20))],
      });
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain("separate caps");
    expect(message).toContain("reference them by URL");
  });

  it("never puts the payload in the error, in the message OR in details", () => {
    // These parts are megabytes each and the error gets logged and serialised,
    // so the payload must appear in neither `message` nor `details`. `details`
    // is the field most callers log verbatim, so it is asserted too.
    let caught: unknown = null;
    try {
      validateCreateMessageInput({
        ...base,
        content: [anthropic(payload(20)), anthropic(payload(20))],
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DialogueDBError);
    const serialised = JSON.stringify({
      message: (caught as DialogueDBError).message,
      details: (caught as DialogueDBError).details,
    });
    expect(serialised).not.toContain("AAAA");
  });

  it("does not count url-origin images, which carry no bytes", () => {
    // Referencing by URL is the workaround the error recommends, so counting
    // those against the transport budget would make the advice self-defeating.
    const many = Array.from({ length: 20 }, () => ({
      type: "image_url",
      image_url: { url: "https://cdn.example.com/very-large-photo.png" },
    }));

    expect(() =>
      validateCreateMessageInput({ ...base, content: many })
    ).not.toThrow();
  });

  it("lets a normal multi-image message through", () => {
    // The guard must not become the limit. Three 5 MiB images encode to about
    // 20 MiB, comfortably inside the ceiling.
    expect(() =>
      validateCreateMessageInput({
        ...base,
        content: [
          anthropic(payload(5)),
          anthropic(payload(5)),
          anthropic(payload(5)),
        ],
      })
    ).not.toThrow();
  });
});
