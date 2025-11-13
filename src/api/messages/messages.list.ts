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
  const endpoint = settings.get("endpoint");
  headers.set("Authorization", `Bearer ${apiKey}`);

  const params = new URLSearchParams();

  if (options.limit) {
    params.set("limit", options.limit.toString());
  }
  if (options.next) {
    params.set("next", options.next);
  }

  const url = `${endpoint}/dialogue/${dialogueId}/messages`;

  const req = await apiRequest<ListResponse<IMessage>>(url, {
    method: "get",
    headers,
    params,
  });

  return req;
}
