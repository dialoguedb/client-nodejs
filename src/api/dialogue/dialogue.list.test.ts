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
    expect(spyList).toHaveBeenCalledWith("endpoint");
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/dialogue`,
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
    expect(spyList).toHaveBeenCalledWith("endpoint");
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const expectedParams = new URLSearchParams();
    expectedParams.set("limit", "2");
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/dialogue`,
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
  it("will call create with default settings", async () => {
    const id = "created-item-id";
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
    getConfigMock.mockImplementationOnce(() => {
      return settings;
    });

    const results = await list({ limit: 2 });
    expect(spyList).toHaveBeenCalledWith("apiKey");
    expect(spyList).toHaveBeenCalledWith("endpoint");
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const expectedParams = new URLSearchParams();
    expectedParams.set("limit", "2");
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/dialogue`,
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
});
