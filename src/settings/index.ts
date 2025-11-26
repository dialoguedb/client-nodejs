import { Settings, SettingsContainer } from "./class.SettingsContainer";

export const settings = new SettingsContainer();

export function getConfig() {
  return settings;
}

/**
 * Mutates the global settings singleton.
 * Use this for app-wide configuration at startup.
 */
export function setGlobalConfig(options: Partial<Settings>): SettingsContainer {
  return settings.use(options);
}
