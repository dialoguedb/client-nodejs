import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest, DialogueDBError } from "@/utils/request";
import { create } from "./message.create";

jest.mock("@/utils/request", () => ({
  apiRequest: jest.fn(),
  DialogueDBError: jest.requireActual("@/utils/request").DialogueDBError,
}));

describe("message.create", () => {
  const apiRequestMock = apiRequest as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a message successfully", async () => {
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
      `${endpoint}/messages?dialogueId=${dialogueId}`,
      {
        method: "post",
        headers: expect.any(Headers),
        body: JSON.stringify({
          role: "user",
          content: "Hello world",
        }),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );

    expect(result).toEqual(mockResponse);
  });

  it("should throw error for invalid input - missing dialogueId", async () => {
    const input = {
      role: "user",
      content: "Hello",
    } as any;

    await expect(create(input)).rejects.toThrow("dialogueId is required");
    await expect(create(input)).rejects.toBeInstanceOf(DialogueDBError);

    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("should throw error for invalid input - missing role", async () => {
    const input = {
      dialogueId: "dialogue-123",
      content: "Hello",
    } as any;

    await expect(create(input)).rejects.toThrow("role is required");
    await expect(create(input)).rejects.toBeInstanceOf(DialogueDBError);

    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("should throw error for invalid input - missing content", async () => {
    const input = {
      dialogueId: "dialogue-123",
      role: "user",
    } as any;

    await expect(create(input)).rejects.toThrow("content is required");
    await expect(create(input)).rejects.toBeInstanceOf(DialogueDBError);

    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("should create message with optional fields", async () => {
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

    expect(bodyArg.role).toBe("assistant");
    expect(bodyArg.content).toBe("Hello!");
    expect(bodyArg.id).toBe("message-123");
    expect(bodyArg.metadata).toEqual({ key: "value" });
    expect(bodyArg.tags).toEqual(["important"]);

    expect(result).toEqual(mockResponse);
  });

  it("should include namespace query param when provided", async () => {
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";
    const input = {
      dialogueId,
      namespace: "my-namespace",
      role: "user",
      content: "Hello world",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", "my-api-key");
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({});

    await create(input, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    expect(callArgs[0]).toBe(
      `${endpoint}/messages?dialogueId=${dialogueId}&namespace=my-namespace`
    );
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
});
