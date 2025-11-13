import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { DeleteMessageInput } from "@/types";
import { isGetMessageInput } from "@/methods/validation.message";

export async function remove(
  input: DeleteMessageInput,
  settings: SettingsContainer = getConfig()
) {
  const valid = isGetMessageInput(input);
  if (!valid[0]) {
    throw new Error(valid[1]);
  }

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  await apiRequest(
    `${endpoint}/dialogue/${input.dialogueId}/messages/${input.id}`,
    {
      method: "delete",
      headers,
    }
  );
}
