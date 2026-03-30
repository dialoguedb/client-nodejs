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
  const endpoint = settings.getApiUrl();
  headers.set("Authorization", `Bearer ${apiKey}`);

  const params = new URLSearchParams();
  params.set("dialogueId", input.dialogueId);
  if (input.namespace) {
    params.set("namespace", input.namespace);
  }
  const url = `${endpoint}/message/${input.id}?${params.toString()}`;

  await apiRequest(
    url,
    {
      method: "delete",
      headers,
    },
    settings.getRetryConfig()
  );
}
