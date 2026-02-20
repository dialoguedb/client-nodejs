import { SettingsContainer } from "./class.SettingsContainer";

describe("SettingsContainer", () => {
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
  it("will set multiple via use()", async () => {
    const apiKey = "the-key";
    const endpoint = "the-endpoint";
    const settings = new SettingsContainer();
    settings.use({ apiKey, endpoint });
    expect(settings.get("endpoint")).toEqual(endpoint);
    expect(settings.get("apiKey")).toEqual(apiKey);
    expect(settings.has("apiKey")).toEqual(true);
    expect(settings.has("endpoint")).toEqual(true);
  });

  describe("constructor defaults", () => {
    it("sets default retries to 3", () => {
      const settings = new SettingsContainer();
      expect(settings.get("retries")).toBe(3);
    });

    it("sets default retryMinTimeout to 1000", () => {
      const settings = new SettingsContainer();
      expect(settings.get("retryMinTimeout")).toBe(1000);
    });

    it("sets default retryMaxTimeout to 10000", () => {
      const settings = new SettingsContainer();
      expect(settings.get("retryMaxTimeout")).toBe(10000);
    });

    it("accepts explicit retries: 0 to disable retries", () => {
      const settings = new SettingsContainer({ retries: 0 });
      expect(settings.get("retries")).toBe(0);
    });

    it("accepts explicit retryMinTimeout", () => {
      const settings = new SettingsContainer({ retryMinTimeout: 500 });
      expect(settings.get("retryMinTimeout")).toBe(500);
    });

    it("accepts explicit retryMaxTimeout", () => {
      const settings = new SettingsContainer({ retryMaxTimeout: 5000 });
      expect(settings.get("retryMaxTimeout")).toBe(5000);
    });
  });

  describe("has()", () => {
    it("returns true for retries set to 0", () => {
      const settings = new SettingsContainer({ retries: 0 });
      expect(settings.has("retries")).toBe(true);
    });

    it("returns true for non-empty string", () => {
      const settings = new SettingsContainer({ apiKey: "key" });
      expect(settings.has("apiKey")).toBe(true);
    });

    it("returns false for empty string apiKey", () => {
      const settings = new SettingsContainer({ apiKey: "" });
      expect(settings.has("apiKey")).toBe(false);
    });
  });

  describe("use()", () => {
    it("skips undefined values", () => {
      const settings = new SettingsContainer({ apiKey: "original" });
      settings.use({ apiKey: undefined, endpoint: "new-endpoint" });
      expect(settings.get("apiKey")).toBe("original");
      expect(settings.get("endpoint")).toBe("new-endpoint");
    });

    it("returns the settings container for chaining", () => {
      const settings = new SettingsContainer();
      const result = settings.use({ apiKey: "key" });
      expect(result).toBe(settings);
    });
  });

  describe("getRetryConfig()", () => {
    it("returns retry config object", () => {
      const settings = new SettingsContainer({
        retries: 5,
        retryMinTimeout: 200,
        retryMaxTimeout: 8000,
      });
      expect(settings.getRetryConfig()).toEqual({
        retries: 5,
        retryMinTimeout: 200,
        retryMaxTimeout: 8000,
      });
    });
  });
});
