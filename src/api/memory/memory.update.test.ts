import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { update } from "./memory.update";

jest.mock("@/utils/request", () => ({
  apiRequest: jest.fn(),
}));

describe("memory.update", () => {
  const apiRequestMock = apiRequest as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update memory tags successfully", async () => {
    const apiKey = "my-api-key";
    const endpoint = "https://api.example.com";
    const memoryKey = "user-preferences";

    const input = {
      key: memoryKey,
      tags: ["important", "user-data"],
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", apiKey);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      key: memoryKey,
      value: { theme: "dark" },
      tags: ["important", "user-data"],
      modified: "2024-01-02T00:00:00.000Z",
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await update(input, settings);

    expect(result).toEqual(mockResponse);
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/memory/${memoryKey}`,
      {
        method: "put",
        headers: expect.any(Headers),
        body: JSON.stringify({ tags: ["important", "user-data"] }),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
  });

  it("should update memory with empty tags array", async () => {
    const apiKey = "my-api-key";
    const endpoint = "https://api.example.com";
    const memoryKey = "session-data";

    const input = {
      key: memoryKey,
      tags: [],
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", apiKey);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      key: memoryKey,
      tags: [],
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await update(input, settings);

    expect(result).toEqual(mockResponse);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/memory/${memoryKey}`,
      {
        method: "put",
        headers: expect.any(Headers),
        body: JSON.stringify({ tags: [] }),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
  });

  it("should update memory without tags (empty body)", async () => {
    const apiKey = "my-api-key";
    const endpoint = "https://api.example.com";
    const memoryKey = "test-memory";

    const input = {
      key: memoryKey,
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", apiKey);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      key: memoryKey,
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await update(input, settings);

    expect(result).toEqual(mockResponse);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/memory/${memoryKey}`,
      {
        method: "put",
        headers: expect.any(Headers),
        body: JSON.stringify({}),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
  });

  it("should set Authorization header correctly", async () => {
    const apiKey = "test-api-key-123";
    const endpoint = "https://api.example.com";
    const input = {
      key: "test-memory-key",
      tags: ["test"],
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", apiKey);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({});

    await update(input, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    const headers = callArgs[1].headers;

    expect(headers.get("Authorization")).toBe(`Bearer ${apiKey}`);
  });

  it("should use correct endpoint path", async () => {
    const endpoint = "https://api.example.com";
    const memoryKey = "config:app:settings";
    const input = {
      key: memoryKey,
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", "key");
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({});

    await update(input, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    expect(callArgs[0]).toBe(`${endpoint}/memory/${memoryKey}`);
  });

  it("should handle keys with special characters", async () => {
    const apiKey = "my-api-key";
    const endpoint = "https://api.example.com";
    const memoryKey = "user:preferences:theme";

    const input = {
      key: memoryKey,
      tags: ["special"],
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", apiKey);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({});

    await update(input, settings);

    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/memory/${memoryKey}`,
      {
        method: "put",
        headers: expect.any(Headers),
        body: JSON.stringify({ tags: ["special"] }),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
  });
});