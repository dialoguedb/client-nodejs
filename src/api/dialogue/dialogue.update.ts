import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { IDialogue, UpdateDialogueInput } from "@/types/index";
import { getConfig } from "@/settings";
import { isUpdateDialogueInput } from "@/methods/validation.dialogue";

export async function update(
  input: UpdateDialogueInput,
  settings: SettingsContainer = getConfig()
) {
  const valid = isUpdateDialogueInput(input);
  if (!valid[0]) {
    throw new Error(valid[1]);
  }

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  const req = await apiRequest<IDialogue>(`${endpoint}/dialogue`, {
    method: "put",
    headers,
    body: JSON.stringify(input),
  });

  return req;
}
