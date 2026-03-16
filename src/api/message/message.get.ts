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

  const params = new URLSearchParams();
  params.set("dialogueId", input.dialogueId);
  if (input.namespace) {
    params.set("namespace", input.namespace);
  }
  const url = `${endpoint}/message/${input.id}?${params.toString()}`;

  return apiRequest<IMessage>(
    url,
    {
      method: "get",
      headers,
    },
    settings.getRetryConfig()
  );
}
