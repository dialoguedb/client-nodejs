import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { remove } from "./memory.remove";

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

describe("memory.remove", () => {
  const apiRequestMock = apiRequest as jest.Mock;
  const getConfigMock = getConfig as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should remove memory successfully", async () => {
    const apiKey = "my-api-key";
    const endpoint = "https://api.example.com";
    const memoryId = "user-preferences";

    const input = {
      id: memoryId,
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", apiKey);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce(undefined);

    await remove(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/memory/${memoryId}`,
      {
        method: "delete",
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

    apiRequestMock.mockResolvedValueOnce(undefined);

    await remove({ id: memoryId, namespace: "my-namespace" }, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    expect(callArgs[0]).toBe(
      `${endpoint}/memory/${memoryId}?namespace=my-namespace`
    );
  });

  it("should remove memory with different key", async () => {
    const apiKey = "my-api-key";
    const endpoint = "https://api.example.com";
    const memoryId = "session-data-123";

    const input = {
      id: memoryId,
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", apiKey);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce(undefined);

    await remove(input, settings);

    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/memory/${memoryId}`,
      {
        method: "delete",
        headers: expect.any(Headers),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
  });

  it("should set Authorization header correctly", async () => {
    const apiKey = "test-api-key-123";
    const endpoint = "https://api.example.com";
    const input = {
      id: "test-memory-key",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", apiKey);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce(undefined);

    await remove(input, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    const headers = callArgs[1].headers;

    expect(headers.get("Authorization")).toBe(`Bearer ${apiKey}`);
  });

  it("should handle keys with special characters", async () => {
    const apiKey = "my-api-key";
    const endpoint = "https://api.example.com";
    const memoryId = "user:preferences:theme";

    const input = {
      id: memoryId,
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", apiKey);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce(undefined);

    await remove(input, settings);

    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/memory/${memoryId}`,
      {
        method: "delete",
        headers: expect.any(Headers),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
  });

  it("should return void (no return value)", async () => {
    const settings = new SettingsContainer();
    settings.set("apiKey", "key");
    settings.set("endpoint", "https://api.example.com");

    apiRequestMock.mockResolvedValueOnce(undefined);

    const result = await remove({ id: "test" }, settings);

    expect(result).toBeUndefined();
  });

  it("should use global config when no settings provided", async () => {
    apiRequestMock.mockResolvedValueOnce(undefined);

    await remove({ id: "test-key" });

    expect(getConfigMock).toHaveBeenCalled();
    expect(apiRequestMock).toHaveBeenCalledWith(
      "https://global.example.com/memory/test-key",
      expect.objectContaining({ method: "delete" }),
      expect.any(Object)
    );
  });
});
