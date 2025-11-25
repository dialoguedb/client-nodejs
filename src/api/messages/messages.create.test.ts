import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { create } from "./messages.create";

jest.mock("@/utils/request", () => ({
  apiRequest: jest.fn(),
}));

describe("messages.create", () => {
  const apiRequestMock = apiRequest as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
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
      `${endpoint}/dialogue/${dialogueId}/messages`,
      {
        method: "post",
        headers: expect.any(Headers),
        body: JSON.stringify(input.messages),
      }
    );

    expect(result).toEqual(mockResponse);
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
    expect(callArgs[0]).toBe(`${endpoint}/dialogue/${dialogueId}/messages`);
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
});
