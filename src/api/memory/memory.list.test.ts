import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { list } from "./memory.list";
import { getConfig } from "@/settings";

jest.mock("@/utils/request", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("@/settings", () => ({
  getConfig: jest.fn(),
}));

describe("memory.list", () => {
  const apiRequestMock = apiRequest as jest.Mock;
  const getConfigMock = getConfig as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should list memories successfully", async () => {
    const id = "memory-item-id";
    const key = "my-api-key";
    const endpoint = "https://api.example.com";

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${key}`);

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const spyGet = jest.spyOn(settings, "get");

    const mockResponse = {
      items: [{ id, value: "test-value", created: "2024-01-01T00:00:00.000Z" }],
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const results = await list({}, settings);

    expect(spyGet).toHaveBeenCalledWith("apiKey");
    expect(spyGet).toHaveBeenCalledWith("endpoint");
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/memory`,
      {
        method: "get",
        headers,
        params: new URLSearchParams(),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );

    expect(results.items[0].id).toEqual(id);

    spyGet.mockReset();
    spyGet.mockRestore();
  });

  it("should list memories with limit", async () => {
    const id = "memory-item-id";
    const key = "my-api-key";
    const endpoint = "https://api.example.com";

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${key}`);

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const spyGet = jest.spyOn(settings, "get");

    apiRequestMock.mockResolvedValueOnce({ items: [{ id }] });

    const results = await list({ limit: 5 }, settings);

    expect(spyGet).toHaveBeenCalledWith("apiKey");
    expect(spyGet).toHaveBeenCalledWith("endpoint");
    expect(apiRequestMock).toHaveBeenCalledTimes(1);

    const expectedParams = new URLSearchParams();
    expectedParams.set("limit", "5");
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/memory`,
      {
        method: "get",
        headers,
        params: expectedParams,
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );

    expect(results.items[0].id).toEqual(id);

    spyGet.mockReset();
    spyGet.mockRestore();
  });

  it("should use global config when no settings provided", async () => {
    const id = "memory-item-id";
    const key = "my-api-key";
    const endpoint = "https://api.example.com";

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [{ id }] });
    getConfigMock.mockImplementationOnce(() => settings);

    const results = await list({ limit: 10 });

    expect(getConfigMock).toHaveBeenCalled();
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(results.items[0].id).toEqual(id);
  });

  it("should return pagination token when present", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      items: [{ id: "item-1" }],
      next: "next-page-token",
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const results = await list({}, settings);

    expect(results.next).toEqual("next-page-token");
    expect(results.items).toHaveLength(1);
  });

  it("should set Authorization header correctly", async () => {
    const key = "test-api-key-123";
    const endpoint = "https://api.example.com";

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [] });

    await list({}, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    const headers = callArgs[1].headers;

    expect(headers.get("Authorization")).toBe(`Bearer ${key}`);
  });

  describe("prepareQuery filters", () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    let settings: SettingsContainer;

    beforeEach(() => {
      settings = new SettingsContainer();
      settings.set("apiKey", key);
      settings.set("endpoint", endpoint);
      apiRequestMock.mockResolvedValue({ items: [] });
    });

    it("includes order parameter", async () => {
      await list({ order: "desc" }, settings);

      const params = apiRequestMock.mock.calls[0][1].params;
      expect(params.get("order")).toBe("desc");
    });

    it("includes order asc parameter", async () => {
      await list({ order: "asc" }, settings);

      const params = apiRequestMock.mock.calls[0][1].params;
      expect(params.get("order")).toBe("asc");
    });

    it("includes next parameter", async () => {
      await list({ next: "pagination-token" }, settings);

      const params = apiRequestMock.mock.calls[0][1].params;
      expect(params.get("next")).toBe("pagination-token");
    });

    it("includes created date filter", async () => {
      await list({ created: "2024-01-01" }, settings);

      const params = apiRequestMock.mock.calls[0][1].params;
      expect(params.get("created")).toBe("2024-01-01");
    });

    it("includes startDate filter", async () => {
      await list({ startDate: "2024-01-01" }, settings);

      const params = apiRequestMock.mock.calls[0][1].params;
      expect(params.get("startDate")).toBe("2024-01-01");
    });

    it("includes endDate filter", async () => {
      await list({ endDate: "2024-12-31" }, settings);

      const params = apiRequestMock.mock.calls[0][1].params;
      expect(params.get("endDate")).toBe("2024-12-31");
    });

    it("includes both startDate and endDate for date range", async () => {
      await list({ startDate: "2024-01-01", endDate: "2024-12-31" }, settings);

      const params = apiRequestMock.mock.calls[0][1].params;
      expect(params.get("startDate")).toBe("2024-01-01");
      expect(params.get("endDate")).toBe("2024-12-31");
    });

    it("includes namespace filter", async () => {
      await list({ namespace: "my-namespace" }, settings);

      const params = apiRequestMock.mock.calls[0][1].params;
      expect(params.get("namespace")).toBe("my-namespace");
    });

    it("combines multiple filters", async () => {
      await list(
        {
          limit: 10,
          order: "asc",
          namespace: "test-ns",
          startDate: "2024-01-01",
        },
        settings
      );

      const params = apiRequestMock.mock.calls[0][1].params;
      expect(params.get("limit")).toBe("10");
      expect(params.get("order")).toBe("asc");
      expect(params.get("namespace")).toBe("test-ns");
      expect(params.get("startDate")).toBe("2024-01-01");
    });

    it("excludes startDate and endDate when created is provided", async () => {
      await list({ created: "2024-06-15" }, settings);

      const params = apiRequestMock.mock.calls[0][1].params;
      expect(params.get("created")).toBe("2024-06-15");
      expect(params.has("startDate")).toBe(false);
      expect(params.has("endDate")).toBe(false);
    });

    it("handles empty filters", async () => {
      await list({}, settings);

      const params = apiRequestMock.mock.calls[0][1].params;
      expect(params.toString()).toBe("");
    });

    it("combines limit, order, next, and namespace filters", async () => {
      await list(
        {
          limit: 20,
          order: "desc",
          next: "page-2-token",
          namespace: "production",
        },
        settings
      );

      const params = apiRequestMock.mock.calls[0][1].params;
      expect(params.get("limit")).toBe("20");
      expect(params.get("order")).toBe("desc");
      expect(params.get("next")).toBe("page-2-token");
      expect(params.get("namespace")).toBe("production");
    });
  });

  describe("response handling", () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    let settings: SettingsContainer;

    beforeEach(() => {
      settings = new SettingsContainer();
      settings.set("apiKey", key);
      settings.set("endpoint", endpoint);
    });

    it("returns empty items array when no memories exist", async () => {
      apiRequestMock.mockResolvedValueOnce({ items: [] });

      const results = await list({}, settings);

      expect(results.items).toEqual([]);
      expect(results.next).toBeUndefined();
    });

    it("returns multiple memory items", async () => {
      const mockItems = [
        { id: "mem-1", value: "value-1", created: "2024-01-01T00:00:00.000Z" },
        { id: "mem-2", value: "value-2", created: "2024-01-02T00:00:00.000Z" },
        { id: "mem-3", value: "value-3", created: "2024-01-03T00:00:00.000Z" },
      ];

      apiRequestMock.mockResolvedValueOnce({ items: mockItems });

      const results = await list({}, settings);

      expect(results.items).toHaveLength(3);
      expect(results.items[0].id).toBe("mem-1");
      expect(results.items[1].id).toBe("mem-2");
      expect(results.items[2].id).toBe("mem-3");
    });

    it("returns memory with complex value types", async () => {
      const mockItems = [
        {
          id: "object-mem",
          value: { nested: { data: "test" } },
          type: "object",
          created: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "array-mem",
          value: [1, 2, 3],
          type: "array",
          created: "2024-01-01T00:00:00.000Z",
        },
      ];

      apiRequestMock.mockResolvedValueOnce({ items: mockItems });

      const results = await list({}, settings);

      expect(results.items[0].value).toEqual({ nested: { data: "test" } });
      expect(results.items[1].value).toEqual([1, 2, 3]);
    });
  });
});
