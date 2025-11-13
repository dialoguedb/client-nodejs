import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { IDialogue, GetDialogueInput } from "@/types/index";
import { getConfig } from "@/settings";
import { isGetDialogueInput } from "@/methods/validation.dialogue";

export async function get(
  input: GetDialogueInput,
  settings: SettingsContainer = getConfig()
) {
  const valid = isGetDialogueInput(input);
  if (!valid[0]) {
    throw new Error(valid[1]);
  }

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  let url = `${endpoint}/dialogue/${input.id}`;

  const req = await apiRequest<IDialogue | null>(url, {
    method: "get",
    headers,
  });

  return req;
}
