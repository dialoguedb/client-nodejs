import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { IDialogue, UpdateDialogueInput } from "@/types/index";
import { getConfig } from "@/settings";
import { validateUpdateDialogueInput } from "@/methods/validators";

export async function update(
  input: UpdateDialogueInput,
  settings: SettingsContainer = getConfig()
) {
  validateUpdateDialogueInput(input);

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.getApiUrl();
  headers.set("Authorization", `Bearer ${apiKey}`);

  let url = `${endpoint}/dialogue/${input.id}`;
  if (input.namespace) {
    url += `?namespace=${encodeURIComponent(input.namespace)}`;
  }

  return apiRequest<IDialogue>(
    url,
    {
      method: "put",
      headers,
      body: JSON.stringify(input),
    },
    settings.getRetryConfig()
  );
}
