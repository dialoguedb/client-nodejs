import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { search } from "./index";

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

describe("search", () => {
  const apiRequestMock = apiRequest as jest.Mock;
  const getConfigMock = getConfig as jest.Mock;
  const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  it("should search with required fields", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const filters = {
      query: "test search",
      object: "message" as const,
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      items: [
        {
          id: "message-1",
          content: "test search result",
        },
      ],
      next: undefined,
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await search(filters, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const expectedParams = new URLSearchParams();
    expectedParams.set("object", "message");
    expectedParams.set("query", "test search");

    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/api/v1/search`,
      {
        method: "POST",
        headers: expect.any(Headers),
        body: JSON.stringify(filters),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );

    expect(result).toEqual(mockResponse);
  });

  it("should search with limit parameter", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const filters = {
      query: "test",
      object: "message" as const,
      limit: 5,
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [], next: undefined });

    await search(filters, settings);

    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/api/v1/search`,
      {
        method: "POST",
        headers: expect.any(Headers),
        body: JSON.stringify(filters),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
  });

  it("should search with filter.created parameter", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const filters = {
      query: "test",
      object: "message" as const,
      filter: {
        created: "2024-01-01T00:00:00.000Z",
      },
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [], next: undefined });

    await search(filters, settings);

    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/api/v1/search`,
      {
        method: "POST",
        headers: expect.any(Headers),
        body: JSON.stringify(filters),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
  });

  it("should set Authorization header correctly", async () => {
    const key = "test-api-key-123";
    const endpoint = "https://api.example.com";
    const filters = {
      query: "test",
      object: "message" as const,
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [], next: undefined });

    await search(filters, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    const headers = callArgs[1].headers;

    expect(headers.get("Authorization")).toBe(`Bearer ${key}`);
  });

  it("should use global config when no settings provided", async () => {
    const mockResponse = { items: [], next: undefined };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await search({ query: "test", object: "message" });

    expect(getConfigMock).toHaveBeenCalled();
    expect(apiRequestMock).toHaveBeenCalledWith(
      "https://global.example.com/api/v1/search",
      expect.objectContaining({ method: "POST" }),
      expect.any(Object)
    );
    expect(result).toEqual(mockResponse);
  });
});
