import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { DeleteDialogueInput } from "@/types";
import { validateGetDialogueInput } from "@/methods/validators";

export async function remove(
  input: DeleteDialogueInput,
  settings: SettingsContainer = getConfig()
) {
  validateGetDialogueInput(input);

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  let url = `${endpoint}/dialogue/${input.id}`;
  if (input.namespace) {
    url += `?namespace=${encodeURIComponent(input.namespace)}`;
  }

  await apiRequest(
    url,
    {
      method: "delete",
      headers,
    },
    settings.getRetryConfig()
  );
}
