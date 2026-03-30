import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { IMemory, CreateMemoryInput } from "@/types/index";
import { getConfig } from "@/settings";

export async function create(
  input: CreateMemoryInput,
  settings: SettingsContainer = getConfig()
) {
  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.getApiUrl();
  headers.set("Authorization", `Bearer ${apiKey}`);

  const req = await apiRequest<IMemory>(
    `${endpoint}/memory`,
    {
      method: "post",
      headers,
      body: JSON.stringify(input),
    },
    settings.getRetryConfig()
  );

  return req;
}
