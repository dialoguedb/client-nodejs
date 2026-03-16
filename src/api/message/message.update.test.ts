import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { update } from "./message.update";

jest.mock("@/utils/request", () => ({
  apiRequest: jest.fn(),
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

describe("message.update", () => {
  const apiRequestMock = apiRequest as jest.Mock;
  const getConfigMock = getConfig as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update message tags successfully", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";
    const messageId = "message-456";

    const input = {
      dialogueId,
      id: messageId,
      tags: ["important", "reviewed"],
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      id: messageId,
      dialogueId,
      role: "user",
      content: "Hello",
      tags: ["important", "reviewed"],
      modified: "2024-01-02T00:00:00.000Z",
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await update(input, settings);

    expect(result).toEqual(mockResponse);
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/messages/${messageId}?dialogueId=${dialogueId}`,
      {
        method: "put",
        headers: expect.any(Headers),
        body: JSON.stringify({ tags: ["important", "reviewed"] }),
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

    await update(
      { dialogueId, id: messageId, namespace: "my-namespace", tags: ["test"] },
      settings
    );

    const callArgs = apiRequestMock.mock.calls[0];
    expect(callArgs[0]).toBe(
      `${endpoint}/messages/${messageId}?dialogueId=${dialogueId}&namespace=my-namespace`
    );
  });

  it("should update message with empty tags array", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";
    const messageId = "message-456";

    const input = {
      dialogueId,
      id: messageId,
      tags: [],
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      id: messageId,
      tags: [],
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await update(input, settings);

    expect(result).toEqual(mockResponse);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/messages/${messageId}?dialogueId=${dialogueId}`,
      {
        method: "put",
        headers: expect.any(Headers),
        body: JSON.stringify({ tags: [] }),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
  });

  it("should update message without tags (empty body)", async () => {
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
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await update(input, settings);

    expect(result).toEqual(mockResponse);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/messages/${messageId}?dialogueId=${dialogueId}`,
      {
        method: "put",
        headers: expect.any(Headers),
        body: JSON.stringify({}),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
  });

  it("should set Authorization header correctly", async () => {
    const key = "test-api-key-123";
    const endpoint = "https://api.example.com";
    const input = {
      dialogueId: "dialogue-123",
      id: "message-456",
      tags: ["test"],
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({});

    await update(input, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    const headers = callArgs[1].headers;

    expect(headers.get("Authorization")).toBe(`Bearer ${key}`);
  });

  it("should use correct endpoint path", async () => {
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-abc";
    const messageId = "message-xyz";
    const input = {
      dialogueId,
      id: messageId,
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", "key");
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({});

    await update(input, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    expect(callArgs[0]).toBe(
      `${endpoint}/messages/${messageId}?dialogueId=${dialogueId}`
    );
  });

  it("should use global config when no settings provided", async () => {
    const dialogueId = "dialogue-123";
    const messageId = "message-456";
    const mockResponse = { id: messageId, tags: ["test"] };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await update({ dialogueId, id: messageId, tags: ["test"] });

    expect(getConfigMock).toHaveBeenCalled();
    expect(apiRequestMock).toHaveBeenCalledWith(
      `https://global.example.com/messages/${messageId}?dialogueId=${dialogueId}`,
      expect.objectContaining({ method: "put" }),
      expect.any(Object)
    );
    expect(result).toEqual(mockResponse);
  });
});
