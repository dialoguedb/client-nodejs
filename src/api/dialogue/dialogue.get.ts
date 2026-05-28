import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { IDialogue, GetDialogueInput } from "@/types/index";
import { getConfig } from "@/settings";
import { validateGetDialogueInput } from "./validate";

export async function get(
  input: GetDialogueInput,
  settings: SettingsContainer = getConfig()
) {
  validateGetDialogueInput(input);

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.getApiUrl();
  headers.set("Authorization", `Bearer ${apiKey}`);

  let url = `${endpoint}/dialogue/${input.id}`;
  if (input.namespace) {
    url += `?namespace=${encodeURIComponent(input.namespace)}`;
  }

  return apiRequest<IDialogue | null>(
    url,
    {
      method: "get",
      headers,
    },
    settings.getRetryConfig()
  );
}
