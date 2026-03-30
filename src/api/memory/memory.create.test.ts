import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { create } from "./memory.create";

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

describe("memory.create", () => {
  const apiRequestMock = apiRequest as jest.Mock;
  const getConfigMock = getConfig as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create memory successfully", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const input = {
      id: "user-preferences",
      value: { theme: "dark", language: "en" },
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      id: "user-preferences",
      value: { theme: "dark", language: "en" },
      created: "2024-01-01T00:00:00.000Z",
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await create(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/api/v1/memory`,
      {
        method: "post",
        headers: expect.any(Headers),
        body: JSON.stringify(input),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );

    expect(result).toEqual(mockResponse);
  });

  it("should create memory with string value", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const input = {
      id: "last-seen",
      value: "2024-01-01",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      ...input,
      created: "2024-01-01T00:00:00.000Z",
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await create(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockResponse);
  });

  it("should set Authorization header correctly", async () => {
    const key = "test-api-key-123";
    const endpoint = "https://api.example.com";
    const input = {
      id: "test-key",
      value: "test-value",
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

  it("should create memory with complex nested object", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const input = {
      id: "complex-data",
      value: {
        nested: {
          array: [1, 2, 3],
          object: { foo: "bar" },
        },
      },
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      ...input,
      created: "2024-01-01T00:00:00.000Z",
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await create(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const callArgs = apiRequestMock.mock.calls[0];
    const bodyArg = JSON.parse(callArgs[1].body);

    expect(bodyArg.id).toBe("complex-data");
    expect(bodyArg.value).toEqual(input.value);
    expect(result).toEqual(mockResponse);
  });

  it("should use global config when no settings provided", async () => {
    const input = {
      id: "test-key",
      value: "test-value",
    };

    const mockResponse = {
      ...input,
      created: "2024-01-01T00:00:00.000Z",
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await create(input);

    expect(getConfigMock).toHaveBeenCalled();
    expect(apiRequestMock).toHaveBeenCalledWith(
      "https://global.example.com/api/v1/memory",
      expect.objectContaining({
        method: "post",
      }),
      expect.any(Object)
    );
    expect(result).toEqual(mockResponse);
  });
});
