import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { IMessage } from "@/types";
import { validateSearchInput } from "./validate";

export type SearchObject = "message" | "dialogue" | "memory";
export type SearchOrderBy = "relevance" | "created" | "modified";
export type SearchOrder = "asc" | "desc";

export interface SearchTagOperators {
  $in?: string[];
  $all?: string[];
  $nin?: string[];
}

export type SearchTagsValue = string[] | SearchTagOperators;

export type SearchMetadataScalar = string | number | boolean;
export type SearchMetadataScalarArray = string[] | number[] | boolean[];

export interface SearchMetadataOperators {
  $eq?: SearchMetadataScalar;
  $ne?: SearchMetadataScalar;
  $in?: SearchMetadataScalarArray;
  $nin?: SearchMetadataScalarArray;
  $gt?: number | string;
  $gte?: number | string;
  $lt?: number | string;
  $lte?: number | string;
}

export type SearchMetadataValue =
  | SearchMetadataScalar
  | SearchMetadataScalarArray
  | SearchMetadataOperators;

export interface SearchDateRangeOperators {
  gte?: string;
  gt?: string;
  lte?: string;
  lt?: string;
}

export type SearchDateFilterValue = string | SearchDateRangeOperators;

export interface SearchFilterOptions {
  created?: SearchDateFilterValue;
  modified?: SearchDateFilterValue;
  /**
   * Restrict message searches to messages that carry at least one image
   * (true) or none (false).
   *
   * Use it with object "message". It is NOT ignored on the other object types:
   * the API ANDs it into the vector predicate for whatever is being searched,
   * and only message vectors are stamped with the flag it tests. So on
   * object "memory", `hasImage: true` returns an EMPTY result set rather than
   * an unfiltered one, and on object "dialogue" it drops dialogues that matched
   * only on their own label. `false` is a no-op on both, because it is written
   * as "not true" so that records predating image support still match.
   */
  hasImage?: boolean;
}

export interface SearchOptions {
  limit?: number;
  namespace?: string;
  timezone?: string;
  tags?: SearchTagsValue;
  filter?: SearchFilterOptions;
  metadata?: Record<string, SearchMetadataValue>;
  orderBy?: SearchOrderBy;
  order?: SearchOrder;
}

export interface SearchInput extends SearchOptions {
  query: string;
  object: SearchObject;
}

export interface SearchMatchEnvelope<M = IMessage> {
  object: "message";
  relevance: number;
  item: M;
}

export interface SearchResultEnvelope<T, M = IMessage> {
  object: SearchObject;
  relevance: number;
  item: T;
  matches?: SearchMatchEnvelope<M>[];
}

export interface SearchRequestEcho {
  orderBy: SearchOrderBy;
  order: SearchOrder;
  candidateOrderBy: "relevance";
  filter?: {
    created?: SearchDateRangeOperators;
    modified?: SearchDateRangeOperators;
  };
}

export interface SearchResponse<T, M = IMessage> {
  results: SearchResultEnvelope<T, M>[];
  request: SearchRequestEcho;
}

export async function search<T, M = IMessage>(
  input: SearchInput,
  settings: SettingsContainer = getConfig()
): Promise<SearchResponse<T, M>> {
  validateSearchInput(input);

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.getApiUrl();
  headers.set("Authorization", `Bearer ${apiKey}`);

  return apiRequest<SearchResponse<T, M>>(
    `${endpoint}/search`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(input),
    },
    settings.getRetryConfig()
  );
}
