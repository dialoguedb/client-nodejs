import { getEnvironmentVariable } from "@/utils/getEnvironmentVariable";
import { API_URL, API_KEY_ENV_NAME } from "@/const";
import type { RetryConfig } from "@/utils/request";

export interface Settings {
  apiKey: string;
  endpoint: string;
  /** Number of retry attempts for transient errors (default: 3, set to 0 to disable) */
  retries: number;
  /** Minimum timeout between retries in ms (default: 1000) */
  retryMinTimeout: number;
  /** Maximum timeout between retries in ms (default: 10000) */
  retryMaxTimeout: number;
}

export type SettingsOrContainer = SettingsContainer | Partial<Settings>;

const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_MIN_TIMEOUT = 1000;
const DEFAULT_RETRY_MAX_TIMEOUT = 10000;

export class SettingsContainer {
  #settings: Settings;

  constructor(options: Partial<Settings> = {}) {
    this.#settings = {
      apiKey: options.apiKey || getEnvironmentVariable(API_KEY_ENV_NAME) || "",
      endpoint: options.endpoint || API_URL,
      retries: options.retries ?? DEFAULT_RETRIES,
      retryMinTimeout: options.retryMinTimeout ?? DEFAULT_RETRY_MIN_TIMEOUT,
      retryMaxTimeout: options.retryMaxTimeout ?? DEFAULT_RETRY_MAX_TIMEOUT,
    };
  }

  assertApiKey(): void {
    const apiKey = this.#settings.apiKey;
    if (!apiKey || apiKey.trim() === "") {
      throw new Error(
        "API key is required. Pass { apiKey: \"your-key\" } or set DIALOGUE_DB_API_KEY environment variable."
      );
    }
  }
  get<K extends keyof Settings>(key: K): Settings[K] {
    return this.#settings[key];
  }
  has(key: keyof Settings) {
    const val = this.get(key);
    return val !== undefined && val !== null && val !== "";
  }
  set<K extends keyof Settings>(key: K, value: Settings[K]) {
    this.#settings[key] = value;
    return this;
  }
  use(options: Partial<Settings>) {
    const keys = Object.keys(options) as (keyof Settings)[];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const val = options[key];
      if (val !== undefined) {
        (this.#settings as Record<keyof Settings, Settings[keyof Settings]>)[
          key
        ] = val;
      }
    }
    return this;
  }

  getRetryConfig(): RetryConfig {
    return {
      retries: this.#settings.retries,
      retryMinTimeout: this.#settings.retryMinTimeout,
      retryMaxTimeout: this.#settings.retryMaxTimeout,
    };
  }
}
