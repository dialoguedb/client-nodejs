import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { IDialogue, CreateDialogueInput } from "@/types/index";
import { getConfig } from "@/settings";
import { isCreateDialogueInput } from "@/methods/validation.dialogue";

export async function create(
  input: CreateDialogueInput,
  settings: SettingsContainer = getConfig()
) {
  const valid = isCreateDialogueInput(input);
  if (!valid[0]) {
    throw new Error(valid[1]);
  }

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  const req = await apiRequest<IDialogue>(`${endpoint}/dialogue`, {
    method: "post",
    headers,
    body: JSON.stringify(input),
  });

  return req;
}
