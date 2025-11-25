import { getEnvironmentVariable } from "@/utils/getEnvironmentVariable";
import { API_URL, API_KEY_ENV_NAME } from "@/const";

export interface Settings {
  apiKey: string;
  endpoint: string;
}

export type SettingsOrContainer = SettingsContainer | Settings;

export class SettingsContainer {
  #settings: Settings;

  constructor(options: Partial<Settings> = {}) {
    this.#settings = {
      apiKey: options.apiKey || getEnvironmentVariable(API_KEY_ENV_NAME) || "",
      endpoint: options.endpoint || API_URL,
    };
  }
  get(key: keyof Settings) {
    return this.#settings[key];
  }
  has(key: keyof Settings) {
    return !!this.get(key);
  }
  set(key: keyof Settings, value: string) {
    this.#settings[key] = value;
    return this;
  }
  use(options: Partial<Settings>) {
    const keys = Object.keys(options) as (keyof typeof options)[];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const val = options[key];
      if (val) {
        this.set(key, val);
      }
    }
    return this;
  }
}
