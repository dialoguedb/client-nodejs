import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { IMemory } from "@/types";

export interface UpdateMemoryInput {
  key: string;
  tags?: string[];
}

export async function update(
  input: UpdateMemoryInput,
  settings: SettingsContainer = getConfig()
) {
  const { key, ...updates } = input;

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  const req = await apiRequest<IMemory>(`${endpoint}/memory/${key}`, {
    method: "put",
    headers,
    body: JSON.stringify(updates),
  });

  return req;
}
