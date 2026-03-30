import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { IMessage, ListMessageFilters, ListResponse } from "@/types";

export async function list(
  input: ListMessageFilters,
  settings: SettingsContainer = getConfig()
) {
  const { dialogueId, ...options } = input;
  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.getApiUrl();
  headers.set("Authorization", `Bearer ${apiKey}`);

  const params = new URLSearchParams();
  params.set("dialogueId", dialogueId);

  if (options.limit) {
    params.set("limit", options.limit.toString());
  }
  if (options.next) {
    params.set("next", options.next);
  }
  if (options.namespace) {
    params.set("namespace", options.namespace);
  }

  const url = `${endpoint}/messages`;

  const req = await apiRequest<ListResponse<IMessage>>(
    url,
    {
      method: "get",
      headers,
      params,
    },
    settings.getRetryConfig()
  );

  return req;
}
