import { settings, getConfig, setGlobalConfig } from "./index";
import { SettingsContainer } from "./class.SettingsContainer";

describe("settings module", () => {
  describe("getConfig", () => {
    it("returns the global settings singleton", () => {
      const config = getConfig();
      expect(config).toBe(settings);
      expect(config).toBeInstanceOf(SettingsContainer);
    });
  });

  describe("setGlobalConfig", () => {
    it("mutates the global settings singleton", () => {
      const testKey = "test-api-key-" + Date.now();
      const testEndpoint = "https://test.api.com";

      setGlobalConfig({ apiKey: testKey, endpoint: testEndpoint });

      expect(settings.get("apiKey")).toBe(testKey);
      expect(settings.get("endpoint")).toBe(testEndpoint);
    });

    it("returns the settings container for chaining", () => {
      const result = setGlobalConfig({ apiKey: "chain-test" });
      expect(result).toBe(settings);
    });
  });
});
