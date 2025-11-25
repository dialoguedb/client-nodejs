import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { IMessage } from "@/types";

export interface UpdateMessageInput {
  dialogueId: string;
  id: string;
  tags?: string[];
}

export async function update(
  input: UpdateMessageInput,
  settings: SettingsContainer = getConfig()
) {
  const { dialogueId, id, ...updates } = input;

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  return apiRequest<IMessage>(
    `${endpoint}/dialogue/${dialogueId}/message/${id}`,
    {
      method: "put",
      headers,
      body: JSON.stringify(updates),
    }
  );
}
