export interface IMemory {
  id: string;
  namespace?: string;
  label?: string;
  description?: string;
  value:
    | string
    | number
    | boolean
    | Record<string, any>
    | Record<string, any>[];
  tags: string[];
  created: string;
  modified: string;
  metadata: Record<string, string | number | boolean>;
}

export interface CreateMemoryInput {
  value:
    | string
    | number
    | boolean
    | Record<string, any>
    | Record<string, any>[];
  id?: string;
  namespace?: string;
  label?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, string | number | boolean>;
}

export type GetMemoryInput = {
  id: string;
};

export type DeleteMemoryInput = GetMemoryInput;

export type ListMemoriesFilterByDateCreated = {
  created: string;
};

export type ListMemoriesFilterByStartDate = {
  startDate: string;
};

export type ListMemoriesFilterByEndDate = {
  endDate: string;
};

export type ListMemoriesFilterByDateRange = {
  startDate: string;
  endDate: string;
};

export type ListMemoriesFilters = {
  namespace?: string;

  order?: "desc" | "asc";
  limit?: number;
  next?: string;
} & (
  | ListMemoriesFilterByDateCreated
  | ListMemoriesFilterByStartDate
  | ListMemoriesFilterByEndDate
  | ListMemoriesFilterByDateRange
  | {}
);

export type SearchMemoryFilters = {
  search: string;
  namespace?: string;
  tags?: string[];
  limit?: number;
} & (
  | ListMemoriesFilterByDateCreated
  | ListMemoriesFilterByStartDate
  | ListMemoriesFilterByEndDate
  | ListMemoriesFilterByDateRange
  | {}
);
