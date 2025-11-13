import { SettingsContainer } from "./class.SettingsContainer";

export const settings = new SettingsContainer();

export function getConfig() {
  return settings;
}
