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

  const { dialogueId, namespace, ...message } = input;

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  const params = new URLSearchParams();
  params.set("dialogueId", dialogueId);
  if (namespace) {
    params.set("namespace", namespace);
  }
  const url = `${endpoint}/message?${params.toString()}`;

  return apiRequest<IMessage>(
    url,
    {
      method: "post",
      headers,
      body: JSON.stringify(message),
    },
    settings.getRetryConfig()
  );
}
