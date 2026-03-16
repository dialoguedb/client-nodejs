import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";

export interface RemoveMemoryInput {
  id: string;
  namespace?: string;
}

export async function remove(
  input: RemoveMemoryInput,
  settings: SettingsContainer = getConfig()
) {
  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  let url = `${endpoint}/memory/${input.id}`;
  if (input.namespace) {
    url += `?namespace=${encodeURIComponent(input.namespace)}`;
  }

  await apiRequest(
    url,
    {
      method: "delete",
      headers,
    },
    settings.getRetryConfig()
  );
}
