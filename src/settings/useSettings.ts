import { getConfig } from "@/settings";
import { Settings } from "./class.SettingsContainer";
import { SettingsContainer } from "./class.SettingsContainer";
import { createConfig } from "./createConfig";

export function useSettings(settings?: SettingsContainer | Settings) {
  if (settings && settings instanceof SettingsContainer) {
    return settings;
  } else if (
    settings &&
    typeof settings === "object" &&
    ("endpoint" in settings || "apiKey" in settings)
  ) {
    return createConfig(settings);
  } else {
    return getConfig();
  }
}
