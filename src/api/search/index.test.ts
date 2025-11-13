import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { search } from "./index";

jest.mock("@/utils/request", () => ({
  apiRequest: jest.fn(),
}));

describe("search", () => {
  const apiRequestMock = apiRequest as jest.Mock;
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

    expect(apiRequestMock).toHaveBeenCalledWith(`${endpoint}/search`, {
      method: "get",
      headers: expect.any(Headers),
      params: expectedParams,
    });

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

    const expectedParams = new URLSearchParams();
    expectedParams.set("object", "message");
    expectedParams.set("query", "test");
    expectedParams.set("limit", "5");

    expect(apiRequestMock).toHaveBeenCalledWith(`${endpoint}/search`, {
      method: "get",
      headers: expect.any(Headers),
      params: expectedParams,
    });
  });

  it("should search with created parameter", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const filters = {
      query: "test",
      object: "message" as const,
      created: "2024-01-01T00:00:00.000Z",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [], next: undefined });

    await search(filters, settings);

    const expectedParams = new URLSearchParams();
    expectedParams.set("object", "message");
    expectedParams.set("query", "test");
    expectedParams.set("created", "2024-01-01T00:00:00.000Z");

    expect(apiRequestMock).toHaveBeenCalledWith(`${endpoint}/search`, {
      method: "get",
      headers: expect.any(Headers),
      params: expectedParams,
    });
  });

  it("should search with startDate and endDate parameters", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const filters = {
      query: "test",
      object: "message" as const,
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [], next: undefined });

    await search(filters, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const callArgs = apiRequestMock.mock.calls[0];
    const params = callArgs[1].params;

    expect(params.get("object")).toBe("message");
    expect(params.get("query")).toBe("test");
    expect(params.get("startDate")).toBe("2024-01-01");
    expect(params.get("endDate")).toBe("2024-12-31");
  });

  it("should prefer created over startDate/endDate", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const filters = {
      query: "test",
      object: "message" as const,
      created: "2024-01-01T00:00:00.000Z",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [], next: undefined });

    await search(filters, settings);

    const expectedParams = new URLSearchParams();
    expectedParams.set("object", "message");
    expectedParams.set("query", "test");
    expectedParams.set("created", "2024-01-01T00:00:00.000Z");
    // Should NOT include startDate/endDate when created is present

    expect(apiRequestMock).toHaveBeenCalledWith(`${endpoint}/search`, {
      method: "get",
      headers: expect.any(Headers),
      params: expectedParams,
    });
  });

  it("should search with dialogueId parameter", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const filters = {
      query: "test",
      object: "message" as const,
      dialogueId: "dialogue-123",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [], next: undefined });

    await search(filters, settings);

    const expectedParams = new URLSearchParams();
    expectedParams.set("object", "message");
    expectedParams.set("query", "test");
    expectedParams.set("dialogueId", "dialogue-123");

    expect(apiRequestMock).toHaveBeenCalledWith(`${endpoint}/search`, {
      method: "get",
      headers: expect.any(Headers),
      params: expectedParams,
    });
  });

  it("should search with namespace parameter", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const filters = {
      query: "test",
      object: "message" as const,
      namespace: "my-namespace",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [], next: undefined });

    await search(filters, settings);

    const expectedParams = new URLSearchParams();
    expectedParams.set("object", "message");
    expectedParams.set("query", "test");
    expectedParams.set("namespace", "my-namespace");

    expect(apiRequestMock).toHaveBeenCalledWith(`${endpoint}/search`, {
      method: "get",
      headers: expect.any(Headers),
      params: expectedParams,
    });
  });

  it("should search with threadOf parameter", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const filters = {
      query: "test",
      object: "message" as const,
      threadOf: "parent-dialogue-123",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [], next: undefined });

    await search(filters, settings);

    const expectedParams = new URLSearchParams();
    expectedParams.set("object", "message");
    expectedParams.set("query", "test");
    expectedParams.set("threadOf", "parent-dialogue-123");

    expect(apiRequestMock).toHaveBeenCalledWith(`${endpoint}/search`, {
      method: "get",
      headers: expect.any(Headers),
      params: expectedParams,
    });
  });

  it("should search with all parameters combined", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const filters = {
      query: "comprehensive search",
      object: "message" as const,
      limit: 20,
      dialogueId: "dialogue-123",
      namespace: "my-namespace",
      threadOf: "parent-123",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [], next: undefined });

    await search(filters, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const callArgs = apiRequestMock.mock.calls[0];
    const params = callArgs[1].params;

    expect(params.get("object")).toBe("message");
    expect(params.get("query")).toBe("comprehensive search");
    expect(params.get("limit")).toBe("20");
    expect(params.get("startDate")).toBe("2024-01-01");
    expect(params.get("endDate")).toBe("2024-12-31");
    expect(params.get("dialogueId")).toBe("dialogue-123");
    expect(params.get("namespace")).toBe("my-namespace");
    expect(params.get("threadOf")).toBe("parent-123");
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

  it("should log filters and params for debugging", async () => {
    const filters = {
      query: "test",
      object: "message" as const,
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", "key");
    settings.set("endpoint", "https://api.example.com");

    apiRequestMock.mockResolvedValueOnce({ items: [], next: undefined });

    await search(filters, settings);

    expect(consoleLogSpy).toHaveBeenCalledWith({ filters });
    expect(consoleLogSpy).toHaveBeenCalledWith({
      params: expect.any(URLSearchParams),
    });
  });
});
