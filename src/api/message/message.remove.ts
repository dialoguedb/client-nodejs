import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { DeleteMessageInput } from "@/types";
import { validateGetMessageInput } from "@/methods/validators";

export async function remove(
  input: DeleteMessageInput,
  settings: SettingsContainer = getConfig()
) {
  validateGetMessageInput(input);

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  await apiRequest(
    `${endpoint}/dialogue/${input.dialogueId}/message/${input.id}`,
    {
      method: "delete",
      headers,
    },
    settings.getRetryConfig()
  );
}
