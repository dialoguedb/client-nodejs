import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { SearchFilters, ListResponse, IMessage } from "@/types/index";
import { getConfig } from "@/settings";
import { isObjectEmpty } from "@/utils/isObjectEmpty";

function prepareQuery(filters: SearchFilters) {
  const params = new URLSearchParams();

  const { query, object, limit, ...restOfQuery } = filters;

  params.set("object", `${object}`);

  params.set("query", `${query}`);

  if (limit) {
    params.set("limit", `${limit}`);
  }

  if (!isObjectEmpty(restOfQuery)) {
    if ("created" in restOfQuery) {
      params.set("created", `${restOfQuery.created}`);
    } else {
      if ("endDate" in restOfQuery) {
        params.set("endDate", `${restOfQuery.endDate}`);
      }
      if ("startDate" in restOfQuery) {
        params.set("startDate", `${restOfQuery.startDate}`);
      }
    }

    // others

    if ("dialogueId" in restOfQuery) {
      params.set("dialogueId", `${restOfQuery.dialogueId}`);
    }
    if ("namespace" in restOfQuery) {
      params.set("namespace", `${restOfQuery.namespace}`);
    }
    if ("threadOf" in restOfQuery) {
      params.set("threadOf", `${restOfQuery.threadOf}`);
    }
  }
  return params;
}

export async function search(
  filters: SearchFilters,
  settings: SettingsContainer = getConfig()
) {
  const params = prepareQuery(filters);
  console.log({ filters });
  console.log({ params });

  const apiKey = settings.get("apiKey");
  const endpoint = settings.get("endpoint");

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${apiKey}`);

  const path = `${endpoint}/search`;

  const req = await apiRequest<ListResponse<IMessage>>(path, {
    method: "get",
    headers,
    params,
  });

  return req;
}
