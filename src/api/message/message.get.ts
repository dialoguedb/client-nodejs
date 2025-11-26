import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { IMessage, GetMessageInput } from "@/types";
import { validateGetMessageInput } from "@/methods/validators";

export async function get(
  input: GetMessageInput,
  settings: SettingsContainer = getConfig()
) {
  validateGetMessageInput(input);

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  return apiRequest<IMessage>(
    `${endpoint}/dialogue/${input.dialogueId}/messages/${input.id}`,
    {
      method: "get",
      headers,
    },
    settings.getRetryConfig()
  );
}
