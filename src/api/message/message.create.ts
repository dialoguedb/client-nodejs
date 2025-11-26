import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { IMessage, CreateMessageInput } from "@/types";
import { validateCreateMessageInput } from "@/methods/validators";

export async function create(
  input: CreateMessageInput,
  settings: SettingsContainer = getConfig()
) {
  validateCreateMessageInput(input);

  const { dialogueId, ...message } = input;

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  return apiRequest<IMessage>(
    `${endpoint}/dialogue/${dialogueId}/message`,
    {
      method: "post",
      headers,
      body: JSON.stringify(message),
    },
    settings.getRetryConfig()
  );
}
