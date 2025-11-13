import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { CreateMessageInput, IMessage } from "@/types";

export async function create(
  input: CreateMessageInput,
  settings: SettingsContainer = getConfig()
) {
  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  const req = await apiRequest<IMessage>(
    `${endpoint}/dialogue/${input.dialogueId}/messages`,
    {
      method: "post",
      headers,
      body: JSON.stringify(input),
    }
  );

  return req;
}
