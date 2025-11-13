import { SettingsContainer } from "./class.SettingsContainer";

describe("createConfig", () => {
  it("will create SettingsContainer", async () => {
    const settings = new SettingsContainer();
    expect(settings).toBeInstanceOf(SettingsContainer);
  });
  it("will set SettingsContainer.apiKey", async () => {
    const key = "the-api-key";
    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    expect(settings.get("apiKey")).toEqual(key);
  });
  it("will set SettingsContainer.endpoint", async () => {
    const endpoint = "the-endpoint";
    const settings = new SettingsContainer();
    settings.set("endpoint", endpoint);
    expect(settings.get("endpoint")).toEqual(endpoint);
  });
  it("will set SettingsContainer.endpoint", async () => {
    const apiKey = "the-key";
    const endpoint = "the-endpoint";
    const settings = new SettingsContainer();
    settings.use({ apiKey, endpoint });
    expect(settings.get("endpoint")).toEqual(endpoint);
    expect(settings.get("apiKey")).toEqual(apiKey);
    expect(settings.has("apiKey")).toEqual(true);
    expect(settings.has("endpoint")).toEqual(true);
  });
});
