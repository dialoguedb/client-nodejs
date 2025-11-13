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
      dialogueId,
      role: "user",
      content: "Hello world",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      id: "message-123",
      dialogueId,
      role: "user",
      content: "Hello world",
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await create(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/dialogue/${dialogueId}/messages`,
      {
        method: "post",
        headers: expect.any(Headers),
        body: JSON.stringify(input),
      }
    );

    expect(result).toEqual(mockResponse);
  });

  it("should create messages with full payload including dialogueId", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";
    const input = {
      dialogueId,
      role: "assistant",
      content: "Hello!",
      id: "message-123",
      metadata: { key: "value" },
      tags: ["important"],
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      ...input,
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await create(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const callArgs = apiRequestMock.mock.calls[0];
    const bodyArg = JSON.parse(callArgs[1].body);

    // Should include dialogueId in the body
    expect(bodyArg.dialogueId).toBe(dialogueId);
    expect(bodyArg.role).toBe("assistant");
    expect(bodyArg.content).toBe("Hello!");
    expect(bodyArg.id).toBe("message-123");
    expect(bodyArg.metadata).toEqual({ key: "value" });
    expect(bodyArg.tags).toEqual(["important"]);

    expect(result).toEqual(mockResponse);
  });

  it("should set Authorization header correctly", async () => {
    const key = "test-api-key-123";
    const endpoint = "https://api.example.com";
    const input = {
      dialogueId: "dialogue-123",
      role: "user",
      content: "Test",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({});

    await create(input, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    const headers = callArgs[1].headers;

    expect(headers.get("Authorization")).toBe(`Bearer ${key}`);
  });

  it("should use correct endpoint path", async () => {
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-abc";
    const input = {
      dialogueId,
      role: "user",
      content: "Test",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", "key");
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({});

    await create(input, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    expect(callArgs[0]).toBe(`${endpoint}/dialogue/${dialogueId}/messages`);
  });
});
