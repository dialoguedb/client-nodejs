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
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  let url = `${endpoint}/dialogue/${input.id}`;

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
