import { getConfig } from "@/settings";
import { Settings } from "./class.SettingsContainer";
import { SettingsContainer } from "./class.SettingsContainer";
import { createConfig } from "./createConfig";
import { isPlainObject } from "@/utils/lodash";
import { isObjectEmpty } from "@/utils/isObjectEmpty";

export function useSettings(settings?: SettingsContainer | Partial<Settings>) {
  if (settings && settings instanceof SettingsContainer) {
    return settings;
  } else if (isPlainObject(settings) && !isObjectEmpty(settings as object)) {
    return createConfig(settings as Partial<Settings>);
  } else {
    return getConfig();
  }
}
