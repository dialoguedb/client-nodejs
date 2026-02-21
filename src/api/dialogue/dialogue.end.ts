import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { IDialogue } from "@/types";
import { getConfig } from "@/settings";

export type EndDialogueInput = {
  id: string;
};

export async function end(
  input: EndDialogueInput,
  settings: SettingsContainer = getConfig()
) {
  if (!input?.id) {
    throw new Error("id is required");
  }

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  const url = `${endpoint}/dialogue/${input.id}/end`;

  return apiRequest<IDialogue>(
    url,
    {
      method: "put",
      headers,
    },
    settings.getRetryConfig()
  );
}
