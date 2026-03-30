import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { get } from "./dialogue.get";
import { getConfig } from "@/settings";

jest.mock("@/utils/request", () => ({
  apiRequest: jest.fn(),
}));
jest.mock("@/settings", () => ({
  getConfig: jest.fn(),
}));

describe("get", () => {
  const apiRequestMock = apiRequest as jest.Mock;
  const getConfigMock = getConfig as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("will call get", async () => {
    const id = "get-item-id";
    const key = "my-api-key";
    const endpoint = "my-api-endpoint";

    const body = { id };

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${key}`);

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const spyGet = jest.spyOn(settings, "get");

    apiRequestMock.mockResolvedValueOnce(body);

    const result = await get({ id: body.id }, settings);

    expect(spyGet).toHaveBeenCalledWith("apiKey");
    expect(spyGet).toHaveBeenCalled();
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/api/v1/dialogue/get-item-id`,
      {
        method: "get",
        headers,
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );

    expect(result?.id).toEqual(id);

    spyGet.mockReset();
    spyGet.mockRestore();
  });

  it("will call get with explicit settings", async () => {
    const id = "get-item-id";
    const key = "my-api-key";
    const endpoint = "my-api-endpoint";

    const body = { id };

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${key}`);

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const spyGet = jest.spyOn(settings, "get");

    apiRequestMock.mockResolvedValueOnce(body);

    const result = await get({ id: body.id }, settings);

    expect(spyGet).toHaveBeenCalledWith("apiKey");
    expect(spyGet).toHaveBeenCalled();
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/api/v1/dialogue/get-item-id`,
      {
        method: "get",
        headers,
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );

    expect(result?.id).toEqual(id);

    spyGet.mockReset();
    spyGet.mockRestore();
  });
  it("will call get with namespace query param", async () => {
    const id = "get-item-id";
    const key = "my-api-key";
    const endpoint = "my-api-endpoint";
    const namespace = "my-namespace";

    const body = { id };

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${key}`);

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce(body);

    const result = await get({ id: body.id, namespace }, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/api/v1/dialogue/get-item-id?namespace=${namespace}`,
      {
        method: "get",
        headers,
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );

    expect(result?.id).toEqual(id);
  });

  it("will call create with default settings", async () => {
    const id = "get-item-id";
    const key = "my-api-key";
    const endpoint = "my-api-endpoint";

    const body = { id };

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${key}`);

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);
    const spyGet = jest.spyOn(settings, "get");

    apiRequestMock.mockResolvedValueOnce(body);
    getConfigMock.mockImplementationOnce(() => {
      return settings;
    });

    const result = await get({ id: body.id });

    expect(spyGet).toHaveBeenCalledWith("apiKey");
    expect(spyGet).toHaveBeenCalled();
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/api/v1/dialogue/get-item-id`,
      {
        method: "get",
        headers,
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );

    expect(result?.id).toEqual(id);

    spyGet.mockReset();
    spyGet.mockRestore();
  });
});
