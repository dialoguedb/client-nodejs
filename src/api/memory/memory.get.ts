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
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  return apiRequest<IMemory>(
    `${endpoint}/memory/${input.key}`,
    {
      method: "get",
      headers,
    },
    settings.getRetryConfig()
  );
}
