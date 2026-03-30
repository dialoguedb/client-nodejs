import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { IMemory, ListMemoriesFilters, ListResponse } from "@/types/index";
import { getConfig } from "@/settings";
import { isObjectEmpty } from "@/utils/isObjectEmpty";

function prepareQuery(filters: ListMemoriesFilters) {
  const params = new URLSearchParams();

  const { limit, order, next, ...restOfQuery } = filters;

  if (limit) {
    params.set("limit", `${limit}`);
  }
  if (order) {
    params.set("order", `${order}`);
  }
  if (next) {
    params.set("next", `${next}`);
  }

  if (!isObjectEmpty(restOfQuery)) {
    // date-based
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
    // namespace filter
    if ("namespace" in restOfQuery) {
      params.set("namespace", `${restOfQuery.namespace}`);
    }
  }
  return params;
}

export async function list(
  filters: ListMemoriesFilters,
  settings: SettingsContainer = getConfig()
) {
  const params = prepareQuery(filters);

  const apiKey = settings.get("apiKey");
  const endpoint = settings.getApiUrl();

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${apiKey}`);

  const path = `${endpoint}/memory`;

  return apiRequest<ListResponse<IMemory>>(
    path,
    {
      method: "get",
      headers,
      params,
    },
    settings.getRetryConfig()
  );
}
