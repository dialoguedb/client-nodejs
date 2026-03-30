import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { IMemory } from "@/types";

export interface UpdateMemoryInput {
  id: string;
  namespace?: string;
  tags?: string[];
}

export async function update(
  input: UpdateMemoryInput,
  settings: SettingsContainer = getConfig()
) {
  const { id, namespace, ...updates } = input;

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.getApiUrl();
  headers.set("Authorization", `Bearer ${apiKey}`);

  let url = `${endpoint}/memory/${id}`;
  if (namespace) {
    url += `?namespace=${encodeURIComponent(namespace)}`;
  }

  const req = await apiRequest<IMemory>(
    url,
    {
      method: "put",
      headers,
      body: JSON.stringify(updates),
    },
    settings.getRetryConfig()
  );

  return req;
}
