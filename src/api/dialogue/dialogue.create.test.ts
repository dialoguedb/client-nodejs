import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { create } from "./dialogue.create";
import { getConfig } from "@/settings";

jest.mock("@/utils/request", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("@/settings", () => ({
  getConfig: jest.fn(),
}));

describe("create", () => {
  const apiRequestMock = apiRequest as jest.Mock;
  const getConfigMock = getConfig as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("will call create", async () => {
    const id = "created-item-id";
    const key = "my-api-key";
    const endpoint = "my-api-endpoint";

    const body = { namespace: "test-ns" };
    const response = { id, namespace: "test-ns" };

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${key}`);

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const spyGet = jest.spyOn(settings, "get");

    apiRequestMock.mockResolvedValueOnce(response);

    const result = await create(body, settings);

    expect(spyGet).toHaveBeenCalledWith("apiKey");
    expect(spyGet).toHaveBeenCalledWith("endpoint");
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/dialogue`,
      {
        method: "post",
        headers,
        body: JSON.stringify(body),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );

    expect(result.id).toEqual(id);

    spyGet.mockReset();
    spyGet.mockRestore();
  });

  it("will call create with default settings", async () => {
    const id = "created-item-id";
    const key = "my-api-key";
    const endpoint = "my-api-endpoint";

    const body = { namespace: "test-ns" };
    const response = { id, namespace: "test-ns" };

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${key}`);

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);
    const spyGet = jest.spyOn(settings, "get");

    apiRequestMock.mockResolvedValueOnce(response);
    getConfigMock.mockImplementationOnce(() => {
      return settings;
    });

    const result = await create(body);

    expect(spyGet).toHaveBeenCalledWith("apiKey");
    expect(spyGet).toHaveBeenCalledWith("endpoint");
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/dialogue`,
      {
        method: "post",
        headers,
        body: JSON.stringify(body),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );

    expect(result.id).toEqual(id);

    spyGet.mockReset();
    spyGet.mockRestore();
  });
});
