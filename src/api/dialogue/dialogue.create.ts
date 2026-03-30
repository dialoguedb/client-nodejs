import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { IDialogue, CreateDialogueInput } from "@/types/index";
import { getConfig } from "@/settings";
import { validateCreateDialogueInput } from "@/methods/validators";

export async function create(
  input: CreateDialogueInput,
  settings: SettingsContainer = getConfig()
) {
  validateCreateDialogueInput(input);

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.getApiUrl();
  headers.set("Authorization", `Bearer ${apiKey}`);

  return apiRequest<IDialogue>(
    `${endpoint}/dialogue`,
    {
      method: "post",
      headers,
      body: JSON.stringify(input),
    },
    settings.getRetryConfig()
  );
}
