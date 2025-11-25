import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { update } from "./dialogue.update";
import { getConfig } from "@/settings";

jest.mock("@/utils/request", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("@/settings", () => ({
  getConfig: jest.fn(),
}));

describe("update", () => {
  const apiRequestMock = apiRequest as jest.Mock;
  const getConfigMock = getConfig as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("will call update", async () => {
    const id = "updated-item-id";
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

    const result = await update(body, settings);

    expect(spyGet).toHaveBeenCalledWith("apiKey");
    expect(spyGet).toHaveBeenCalledWith("endpoint");
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(`${endpoint}/dialogue/${id}`, {
      method: "put",
      headers,
      body: JSON.stringify(body),
    });

    expect(result.id).toEqual(id);

    spyGet.mockReset();
    spyGet.mockRestore();
  });

  it("will call update with default settings", async () => {
    const id = "created-item-id";
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

    const result = await update(body);

    expect(spyGet).toHaveBeenCalledWith("apiKey");
    expect(spyGet).toHaveBeenCalledWith("endpoint");
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(`${endpoint}/dialogue/${id}`, {
      method: "put",
      headers,
      body: JSON.stringify(body),
    });

    expect(result.id).toEqual(id);

    spyGet.mockReset();
    spyGet.mockRestore();
  });
});
