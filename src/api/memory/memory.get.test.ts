import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { get } from "./memory.get";

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

describe("memory.get", () => {
  const apiRequestMock = apiRequest as jest.Mock;
  const getConfigMock = getConfig as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get memory successfully", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const memoryId = "user-preferences";

    const input = {
      id: memoryId,
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      id: memoryId,
      value: { theme: "dark", language: "en" },
      created: "2024-01-01T00:00:00.000Z",
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await get(input, settings);

    expect(result).toEqual(mockResponse);
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/memory/${memoryId}`,
      {
        method: "get",
        headers: expect.any(Headers),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
  });

  it("should include namespace query param when provided", async () => {
    const endpoint = "https://api.example.com";
    const memoryId = "user-preferences";

    const settings = new SettingsContainer();
    settings.set("apiKey", "my-api-key");
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({});

    await get({ id: memoryId, namespace: "my-namespace" }, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    expect(callArgs[0]).toBe(
      `${endpoint}/memory/${memoryId}?namespace=my-namespace`
    );
  });

  it("should get memory with different id", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const memoryId = "last-seen-timestamp";

    const input = {
      id: memoryId,
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      id: memoryId,
      value: "2024-01-01T00:00:00.000Z",
      created: "2024-01-01T00:00:00.000Z",
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await get(input, settings);

    expect(result).toEqual(mockResponse);
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/memory/${memoryId}`,
      {
        method: "get",
        headers: expect.any(Headers),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
  });

  it("should set Authorization header correctly", async () => {
    const key = "test-api-key-123";
    const endpoint = "https://api.example.com";
    const input = {
      id: "test-memory-key",
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

  it("should handle id with special characters", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const memoryId = "user:preferences:theme";

    const input = {
      id: memoryId,
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({});

    await get(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/memory/${memoryId}`,
      {
        method: "get",
        headers: expect.any(Headers),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
  });

  it("should use global config when no settings provided", async () => {
    const memoryId = "test-key";
    const mockResponse = { id: memoryId, value: "test" };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await get({ id: memoryId });

    expect(getConfigMock).toHaveBeenCalled();
    expect(apiRequestMock).toHaveBeenCalledWith(
      "https://global.example.com/memory/test-key",
      expect.objectContaining({ method: "get" }),
      expect.any(Object)
    );
    expect(result).toEqual(mockResponse);
  });
});
