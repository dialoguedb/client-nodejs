import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest, DialogueDBError } from "@/utils/request";
import { get } from "./message.get";

jest.mock("@/utils/request", () => ({
  apiRequest: jest.fn(),
  DialogueDBError: jest.requireActual("@/utils/request").DialogueDBError,
}));

describe("message.get", () => {
  const apiRequestMock = apiRequest as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get a message successfully", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";
    const messageId = "message-456";

    const input = {
      dialogueId,
      id: messageId,
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      id: messageId,
      dialogueId,
      role: "user",
      content: "Hello world",
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await get(input, settings);

    expect(result).toEqual(mockResponse);
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/messages/${messageId}?dialogueId=${dialogueId}`,
      {
        method: "get",
        headers: expect.any(Headers),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
  });

  it("should include namespace query param when provided", async () => {
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";
    const messageId = "message-456";

    const settings = new SettingsContainer();
    settings.set("apiKey", "my-api-key");
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({});

    await get(
      { dialogueId, id: messageId, namespace: "my-namespace" },
      settings
    );

    const callArgs = apiRequestMock.mock.calls[0];
    expect(callArgs[0]).toBe(
      `${endpoint}/messages/${messageId}?dialogueId=${dialogueId}&namespace=my-namespace`
    );
  });

  it("should throw error for invalid input - missing dialogueId", async () => {
    const input = {
      id: "message-123",
    } as any;

    await expect(get(input)).rejects.toThrow("dialogueId is required");
    await expect(get(input)).rejects.toBeInstanceOf(DialogueDBError);

    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("should throw error for invalid input - missing id", async () => {
    const input = {
      dialogueId: "dialogue-123",
    } as any;

    await expect(get(input)).rejects.toThrow("id is required");
    await expect(get(input)).rejects.toBeInstanceOf(DialogueDBError);

    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("should set Authorization header correctly", async () => {
    const key = "test-api-key-123";
    const endpoint = "https://api.example.com";
    const input = {
      dialogueId: "dialogue-123",
      id: "message-456",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({});

    await get(input, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    const headers = callArgs[1].headers;

    expect(headers.get("Authorization")).toBe(`Bearer ${key}`);
  });
});
