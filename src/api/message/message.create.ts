import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { IMessage, CreateMessageInput } from "@/types";
import { isCreateMessageInput } from "@/methods/validation.message";

export async function create(
  input: CreateMessageInput,
  settings: SettingsContainer = getConfig()
) {
  const valid = isCreateMessageInput(input);
  if (!valid[0]) {
    throw new Error(valid[1]);
  }

  const { dialogueId, ...message } = input;

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  const req = await apiRequest<IMessage>(
    `${endpoint}/dialogue/${dialogueId}/message`,
    {
      method: "post",
      headers,
      body: JSON.stringify(message),
    }
  );

  return req;
}
