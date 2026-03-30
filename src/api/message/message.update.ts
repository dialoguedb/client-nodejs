import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { IMessage } from "@/types";

export interface UpdateMessageInput {
  dialogueId: string;
  id: string;
  namespace?: string;
  tags?: string[];
}

export async function update(
  input: UpdateMessageInput,
  settings: SettingsContainer = getConfig()
) {
  const { dialogueId, id, namespace, ...updates } = input;

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.getApiUrl();
  headers.set("Authorization", `Bearer ${apiKey}`);

  const params = new URLSearchParams();
  params.set("dialogueId", dialogueId);
  if (namespace) {
    params.set("namespace", namespace);
  }
  const url = `${endpoint}/message/${id}?${params.toString()}`;

  return apiRequest<IMessage>(
    url,
    {
      method: "put",
      headers,
      body: JSON.stringify(updates),
    },
    settings.getRetryConfig()
  );
}
