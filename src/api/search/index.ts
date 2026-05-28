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
