import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { list } from "./messages.list";

jest.mock("@/utils/request", () => ({
  apiRequest: jest.fn(),
}));

describe("messages.list", () => {
  const apiRequestMock = apiRequest as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should list messages successfully", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";

    const input = {
      dialogueId,
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      items: [
        {
          id: "message-1",
          dialogueId,
          role: "user",
          content: "Hello",
        },
        {
          id: "message-2",
          dialogueId,
          role: "assistant",
          content: "Hi there",
        },
      ],
      next: undefined,
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await list(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const expectedParams = new URLSearchParams();
    expectedParams.set("dialogueId", dialogueId);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/api/v1/messages`,
      {
        method: "get",
        headers: expect.any(Headers),
        params: expectedParams,
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );

    expect(result).toEqual(mockResponse);
  });

  it("should list messages with limit parameter", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";

    const input = {
      dialogueId,
      limit: 5,
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      items: [],
      next: undefined,
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    await list(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const expectedParams = new URLSearchParams();
    expectedParams.set("dialogueId", dialogueId);
    expectedParams.set("limit", "5");
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/api/v1/messages`,
      {
        method: "get",
        headers: expect.any(Headers),
        params: expectedParams,
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
  });

  it("should list messages with next token for pagination", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";

    const input = {
      dialogueId,
      next: "pagination-token-abc",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      items: [],
      next: "next-token",
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    await list(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const expectedParams = new URLSearchParams();
    expectedParams.set("dialogueId", dialogueId);
    expectedParams.set("next", "pagination-token-abc");
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/api/v1/messages`,
      {
        method: "get",
        headers: expect.any(Headers),
        params: expectedParams,
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
  });

  it("should list messages with both limit and next parameters", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";

    const input = {
      dialogueId,
      limit: 10,
      next: "token-xyz",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      items: [],
      next: undefined,
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    await list(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const expectedParams = new URLSearchParams();
    expectedParams.set("dialogueId", dialogueId);
    expectedParams.set("limit", "10");
    expectedParams.set("next", "token-xyz");
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/api/v1/messages`,
      {
        method: "get",
        headers: expect.any(Headers),
        params: expectedParams,
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
  });

  it("should list messages with order parameter", async () => {
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";

    const settings = new SettingsContainer();
    settings.set("apiKey", "my-api-key");
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [], next: undefined });

    await list({ dialogueId, order: "desc" }, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    const params = callArgs[1].params as URLSearchParams;
    expect(params.get("dialogueId")).toBe(dialogueId);
    expect(params.get("order")).toBe("desc");
  });

  it("should send order alongside limit for a recent-N query", async () => {
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";

    const settings = new SettingsContainer();
    settings.set("apiKey", "my-api-key");
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [], next: undefined });

    await list({ dialogueId, limit: 10, order: "desc" }, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    const params = callArgs[1].params as URLSearchParams;
    expect(params.get("limit")).toBe("10");
    expect(params.get("order")).toBe("desc");
  });

  it("should send the created date-prefix filter", async () => {
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";

    const settings = new SettingsContainer();
    settings.set("apiKey", "my-api-key");
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [], next: undefined });

    await list({ dialogueId, created: "2026-06" }, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    const params = callArgs[1].params as URLSearchParams;
    expect(params.get("created")).toBe("2026-06");
  });

  it("should send startDate and endDate range filters", async () => {
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";

    const settings = new SettingsContainer();
    settings.set("apiKey", "my-api-key");
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [], next: undefined });

    await list(
      {
        dialogueId,
        startDate: "2026-01-01T00:00:00Z",
        endDate: "2026-06-01T00:00:00Z",
      },
      settings
    );

    const callArgs = apiRequestMock.mock.calls[0];
    const params = callArgs[1].params as URLSearchParams;
    expect(params.get("startDate")).toBe("2026-01-01T00:00:00Z");
    expect(params.get("endDate")).toBe("2026-06-01T00:00:00Z");
  });

  it("should include namespace in params when provided", async () => {
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";

    const settings = new SettingsContainer();
    settings.set("apiKey", "my-api-key");
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [], next: undefined });

    await list({ dialogueId, namespace: "my-namespace" }, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    const params = callArgs[1].params as URLSearchParams;
    expect(params.get("dialogueId")).toBe(dialogueId);
    expect(params.get("namespace")).toBe("my-namespace");
  });

  it("should use default settings when none provided", async () => {
    const input = {
      dialogueId: "dialogue-123",
    };

    apiRequestMock.mockResolvedValueOnce({ items: [], next: undefined });

    await list(input);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
  });

  it("should set Authorization header correctly", async () => {
    const key = "test-api-key-123";
    const endpoint = "https://api.example.com";
    const input = {
      dialogueId: "dialogue-123",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [], next: undefined });

    await list(input, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    const headers = callArgs[1].headers;

    expect(headers.get("Authorization")).toBe(`Bearer ${key}`);
  });
});
