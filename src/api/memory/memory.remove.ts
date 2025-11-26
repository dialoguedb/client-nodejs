import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";

export interface RemoveMemoryInput {
  key: string;
}

export async function remove(
  input: RemoveMemoryInput,
  settings: SettingsContainer = getConfig()
) {
  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  await apiRequest(
    `${endpoint}/memory/${input.key}`,
    {
      method: "DELETE",
      headers,
    },
    settings.getRetryConfig()
  );
}
