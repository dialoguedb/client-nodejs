import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { IMemory, GetMemoryInput } from "@/types";

export async function get(
  input: GetMemoryInput,
  settings: SettingsContainer = getConfig()
) {
  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.getApiUrl();
  headers.set("Authorization", `Bearer ${apiKey}`);

  let url = `${endpoint}/memory/${input.id}`;
  if (input.namespace) {
    url += `?namespace=${encodeURIComponent(input.namespace)}`;
  }

  return apiRequest<IMemory>(
    url,
    {
      method: "get",
      headers,
    },
    settings.getRetryConfig()
  );
}
