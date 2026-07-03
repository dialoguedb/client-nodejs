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

  if (options.limit !== undefined) {
    params.set("limit", options.limit.toString());
  }
  if (options.order) {
    params.set("order", options.order);
  }
  if (options.next) {
    params.set("next", options.next);
  }
  if (options.namespace) {
    params.set("namespace", options.namespace);
  }

  // Date filters live on the discriminated union members of ListMessageFilters,
  // so narrow with `in` before reading them.
  if ("created" in options && options.created) {
    params.set("created", options.created);
  }
  if ("startDate" in options && options.startDate) {
    params.set("startDate", options.startDate);
  }
  if ("endDate" in options && options.endDate) {
    params.set("endDate", options.endDate);
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
