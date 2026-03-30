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

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.getApiUrl();
  headers.set("Authorization", `Bearer ${apiKey}`);

  const url = `${endpoint}/message`;

  return apiRequest<IMessage>(
    url,
    {
      method: "post",
      headers,
      body: JSON.stringify(input),
    },
    settings.getRetryConfig()
  );
}
