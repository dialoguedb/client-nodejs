import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest, DialogueDBError } from "@/utils/request";
import { getConfig } from "@/settings";
import { create } from "./messages.create";

jest.mock("@/utils/request", () => ({
  apiRequest: jest.fn(),
  DialogueDBError: jest.requireActual("@/utils/request").DialogueDBError,
}));

jest.mock("@/settings", () => {
  const mockSettings = {
    get: jest.fn((key: string) => {
      if (key === "apiKey") return "global-api-key";
      if (key === "endpoint") return "https://global.example.com";
      if (key === "retries") return 3;
      if (key === "retryMinTimeout") return 1000;
      if (key === "retryMaxTimeout") return 10000;
      return undefined;
    }),
    getApiUrl: jest.fn(() => "https://global.example.com/api/v1"),
    getRetryConfig: jest.fn(() => ({
      retries: 3,
      retryMinTimeout: 1000,
      retryMaxTimeout: 10000,
    })),
  };
  return {
    getConfig: jest.fn(() => mockSettings),
  };
});

describe("messages.create", () => {
  const apiRequestMock = apiRequest as jest.Mock;
  const getConfigMock = getConfig as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("the batch transport ceiling", () => {
    // The per-message validator checks each message's inline images against the
    // 36 MiB request ceiling INDEPENDENTLY, and this route serialises every
    // message into one body. Messages that each pass can still add up past it,
    // and the result is the bare, requestId-less 413 from the body parser that
    // the per-message guard exists to eliminate.
    const settings = () => {
      const s = new SettingsContainer();
      s.set("apiKey", "k");
      s.set("endpoint", "https://api.example.com");
      return s;
    };
    // 12 MiB of raw bytes per message, which is ~16 MiB encoded. One is fine.
    const heavyMessage = () => ({
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png",
            data: "A".repeat(12 * 1024 * 1024),
          },
        },
      ],
    });

    it("rejects a batch whose messages each fit but whose body does not", async () => {
      apiRequestMock.mockResolvedValue([]);

      await expect(
        create(
          {
            id: "dialogue-123",
            messages: [heavyMessage(), heavyMessage(), heavyMessage()],
          },
          settings()
        )
      ).rejects.toThrow(DialogueDBError);

      // Nothing left the machine: the point is to replace a transport failure,
      // not to add a second one after paying to upload the body.
      expect(apiRequestMock).not.toHaveBeenCalled();
    });

    it("names the batch, not a message index, and carries no payload", async () => {
      let caught: unknown = null;
      try {
        await create(
          {
            id: "dialogue-123",
            messages: [heavyMessage(), heavyMessage(), heavyMessage()],
          },
          settings()
        );
      } catch (error) {
        caught = error;
      }

      const err = caught as DialogueDBError;
      expect(err.message).toContain("batch");
      expect(err.message).toContain("one body");
      const serialised = JSON.stringify({
        message: err.message,
        details: err.details,
      });
      expect(serialised).not.toContain("AAAA");
    });

    it("lets a batch that fits through untouched", async () => {
      apiRequestMock.mockResolvedValue([]);

      await create(
        { id: "dialogue-123", messages: [heavyMessage()] },
        settings()
      );

      expect(apiRequestMock).toHaveBeenCalledTimes(1);
    });
  });

  it("should create messages successfully", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";
    const input = {
      id: dialogueId,
      messages: [{ role: "user", content: "Hello world" }],
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = [
      {
        id: "message-123",
        dialogueId,
        role: "user",
        content: "Hello world",
      },
    ];

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await create(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/api/v1/messages?dialogueId=${dialogueId}`,
      {
        method: "post",
        headers: expect.any(Headers),
        body: JSON.stringify(input.messages),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );

    expect(result).toEqual(mockResponse);
  });

  it("should include namespace query param when provided", async () => {
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";
    const input = {
      id: dialogueId,
      namespace: "my-namespace",
      messages: [{ role: "user", content: "Hello" }],
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", "my-api-key");
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce([]);

    await create(input, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    expect(callArgs[0]).toBe(
      `${endpoint}/api/v1/messages?dialogueId=${dialogueId}&namespace=my-namespace`
    );
  });

  it("should create messages with full payload", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";
    const input = {
      id: dialogueId,
      messages: [
        {
          role: "assistant",
          content: "Hello!",
          id: "message-123",
          metadata: { key: "value" },
          tags: ["important"],
        },
      ],
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = [
      {
        id: "message-123",
        dialogueId,
        role: "assistant",
        content: "Hello!",
        metadata: { key: "value" },
        tags: ["important"],
      },
    ];

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await create(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const callArgs = apiRequestMock.mock.calls[0];
    const bodyArg = JSON.parse(callArgs[1].body);

    expect(bodyArg[0].role).toBe("assistant");
    expect(bodyArg[0].content).toBe("Hello!");
    expect(bodyArg[0].id).toBe("message-123");
    expect(bodyArg[0].metadata).toEqual({ key: "value" });
    expect(bodyArg[0].tags).toEqual(["important"]);

    expect(result).toEqual(mockResponse);
  });

  it("should set Authorization header correctly", async () => {
    const key = "test-api-key-123";
    const endpoint = "https://api.example.com";
    const input = {
      id: "dialogue-123",
      messages: [{ role: "user", content: "Test" }],
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce([]);

    await create(input, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    const headers = callArgs[1].headers;

    expect(headers.get("Authorization")).toBe(`Bearer ${key}`);
  });

  it("should use correct endpoint path", async () => {
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-abc";
    const input = {
      id: dialogueId,
      messages: [{ role: "user", content: "Test" }],
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", "key");
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce([]);

    await create(input, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    expect(callArgs[0]).toBe(
      `${endpoint}/api/v1/messages?dialogueId=${dialogueId}`
    );
  });

  it("should create multiple messages at once", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";
    const input = {
      id: dialogueId,
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
        { role: "user", content: "How are you?" },
      ],
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = [
      { id: "msg-1", role: "user", content: "Hello" },
      { id: "msg-2", role: "assistant", content: "Hi there!" },
      { id: "msg-3", role: "user", content: "How are you?" },
    ];

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await create(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const callArgs = apiRequestMock.mock.calls[0];
    const bodyArg = JSON.parse(callArgs[1].body);

    expect(bodyArg).toHaveLength(3);
    expect(result).toEqual(mockResponse);
  });

  it("should use global config when no settings provided", async () => {
    const dialogueId = "dialogue-123";
    const mockResponse = [{ id: "msg-1", role: "user", content: "Hello" }];

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await create({
      id: dialogueId,
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(getConfigMock).toHaveBeenCalled();
    expect(apiRequestMock).toHaveBeenCalledWith(
      `https://global.example.com/api/v1/messages?dialogueId=${dialogueId}`,
      expect.objectContaining({ method: "post" }),
      expect.any(Object)
    );
    expect(result).toEqual(mockResponse);
  });

  it("rejects a batch containing a malformed image part without calling the API", async () => {
    const settings = new SettingsContainer();
    settings.set("apiKey", "key");
    settings.set("endpoint", "https://api.example.com");

    await expect(
      create(
        {
          id: "dialogue-123",
          messages: [
            { role: "user", content: "fine" },
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/tiff",
                    data: "aGVsbG8=",
                  },
                },
              ],
            },
          ],
        },
        settings
      )
    ).rejects.toThrow(
      "item 0: image source.media_type must be one of image/jpeg, image/png, image/gif, image/webp"
    );

    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("rejects a batch message missing a role without calling the API", async () => {
    const settings = new SettingsContainer();
    settings.set("apiKey", "key");
    settings.set("endpoint", "https://api.example.com");

    await expect(
      create(
        {
          id: "dialogue-123",
          messages: [{ content: "no role here" } as any],
        },
        settings
      )
    ).rejects.toThrow("role is required");

    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("names the offending message, not just the content item", async () => {
    // Every message in a batch has an item 0, so "item 0: ..." on its own
    // points at all of them. The API reports this as messages[i].content;
    // the local error has to be at least as specific or the caller cannot
    // act on it.
    const settings = new SettingsContainer();
    settings.set("apiKey", "key");
    settings.set("endpoint", "https://api.example.com");

    const filler = { role: "user" as const, content: "fine" };
    let thrown: DialogueDBError | undefined;

    try {
      await create(
        {
          id: "dialogue-123",
          messages: [
            filler,
            filler,
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/tiff",
                    data: "aGVsbG8=",
                  },
                },
              ],
            },
          ],
        },
        settings
      );
    } catch (e) {
      thrown = e as DialogueDBError;
    }

    expect(thrown).toBeInstanceOf(DialogueDBError);
    expect(thrown!.message).toContain("messages[2]");
    expect(thrown!.code).toBe("INVALID_PARAMETER");
    expect(thrown!.details?.[0].field).toBe("messages[2].content");
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("blames the batch, not messages[0], for a bad dialogue id", async () => {
    // dialogueId is a query parameter on this route, not a message field.
    // Reattaching it per message to reuse the single-create validator made a
    // batch-level mistake surface as a fault in the first message.
    const settings = new SettingsContainer();
    settings.set("apiKey", "key");
    settings.set("endpoint", "https://api.example.com");

    await expect(
      create({ id: "", messages: [{ role: "user", content: "hi" }] }, settings)
    ).rejects.toThrow("dialogueId is required");

    await expect(
      create(
        { id: "abc", messages: [{ role: "user", content: "hi" }] },
        settings
      )
    ).rejects.toThrow(/^(?!.*messages\[0\]).*dialogueId/s);

    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("accepts a batch containing a valid image part", async () => {
    const settings = new SettingsContainer();
    settings.set("apiKey", "key");
    settings.set("endpoint", "https://api.example.com");

    apiRequestMock.mockResolvedValueOnce([]);

    await create(
      {
        id: "dialogue-123",
        messages: [
          {
            role: "user",
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
          },
        ],
      },
      settings
    );

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
  });
});
