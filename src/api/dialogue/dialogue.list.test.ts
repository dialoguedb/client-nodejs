import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { list } from "./dialogue.list";
import { getConfig } from "@/settings";

jest.mock("@/utils/request", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("@/settings", () => ({
  getConfig: jest.fn(),
}));

describe("list", () => {
  const apiRequestMock = apiRequest as jest.Mock;
  const getConfigMock = getConfig as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("will call list", async () => {
    const id = "list-item-id";
    const key = "my-api-key";
    const endpoint = "my-api-endpoint";

    const body = { id };

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${key}`);

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const spyList = jest.spyOn(settings, "get");

    apiRequestMock.mockResolvedValueOnce({ items: [body] });

    const results = await list({}, settings);

    expect(spyList).toHaveBeenCalledWith("apiKey");
    expect(spyList).toHaveBeenCalled();
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/api/v1/dialogue`,
      {
        method: "get",
        headers,
        params: new URLSearchParams(),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );

    expect(results.items[0].id).toEqual(id);

    spyList.mockReset();
    spyList.mockRestore();
  });

  it("will call list with limit", async () => {
    const id = "list-item-id";
    const key = "my-api-key";
    const endpoint = "my-api-endpoint";

    const body = { id };

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${key}`);

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const spyList = jest.spyOn(settings, "get");

    apiRequestMock.mockResolvedValueOnce({ items: [body] });

    const results = await list({ limit: 2 }, settings);

    expect(spyList).toHaveBeenCalledWith("apiKey");
    expect(spyList).toHaveBeenCalled();
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const expectedParams = new URLSearchParams();
    expectedParams.set("limit", "2");
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/api/v1/dialogue`,
      {
        method: "get",
        headers,
        params: expectedParams,
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );

    expect(results.items[0].id).toEqual(id);

    spyList.mockReset();
    spyList.mockRestore();
  });
  it("will call list with default settings", async () => {
    const id = "created-item-id";
    const key = "my-api-key";
    const endpoint = "my-api-endpoint";

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({ items: [{ id }] });
    getConfigMock.mockImplementationOnce(() => settings);

    const results = await list({ limit: 2 });

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(results.items[0].id).toEqual(id);
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

    it("includes threadOf filter", async () => {
      await list({ threadOf: "parent-dialogue-id" }, settings);

      const params = apiRequestMock.mock.calls[0][1].params;
      expect(params.get("threadOf")).toBe("parent-dialogue-id");
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
  });
});
