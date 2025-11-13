import { Settings, SettingsContainer } from "./class.SettingsContainer";
import { settings } from "./index";

export function createConfig(
  options: Partial<Settings> = {}
): SettingsContainer {
  return settings.use(options);
}
