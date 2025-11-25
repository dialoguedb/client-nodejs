import { Settings, SettingsContainer } from "./class.SettingsContainer";

/**
 * Creates a new settings container with the provided options.
 * Does NOT mutate the global settings singleton.
 *
 * For global configuration, use setGlobalConfig() instead.
 */
export function createConfig(
  options: Partial<Settings> = {}
): SettingsContainer {
  return new SettingsContainer(options);
}
