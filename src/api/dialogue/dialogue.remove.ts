import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { DeleteDialogueInput } from "@/types";
import { isGetDialogueInput } from "@/methods/validation.dialogue";

export async function remove(
  input: DeleteDialogueInput,
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

  await apiRequest(`${endpoint}/dialogue`, {
    method: "delete",
    headers,
    body: JSON.stringify(input),
  });
}
