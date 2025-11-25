import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";

export interface SearchFilterOptions {
  tags?: string[];
  created?: string;
  createdMonth?: number;
  createdDay?: number;
  createdYear?: number;
  modified?: string;
  modifiedMonth?: number;
  modifiedDay?: number;
  modifiedYear?: number;
}

export interface SearchOptions {
  limit?: number;
  filter?: SearchFilterOptions;
  metadata?: Record<string, any>;
}

export interface SearchInput extends SearchOptions {
  query: string;
  object: "message" | "dialogue" | "memory";
}

export interface SearchResult<T> {
  items: T[];
}

export async function search<T>(
  input: SearchInput,
  settings: SettingsContainer = getConfig()
): Promise<SearchResult<T>> {
  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  return apiRequest<SearchResult<T>>(`${endpoint}/search`, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
}
