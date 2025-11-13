export interface IMessage {
  id: string;
  role: string;
  content: string;
  namespace: string;
  created: string;
  modified: string;
  tags: string[];
  metadata: Record<string, string | number | boolean>;
}

export interface CreateMessageInput {
  dialogueId: string;
  role: string;
  content: string | Record<string, any> | Record<string, any>[];
  id?: string;
  tags?: string[];
  metadata?: Record<string, string | number | boolean>;
  namespace?: string;
  created?: string;
}

export type GetMessageInput = {
  id: string;
  dialogueId: string;
};

export type DeleteMessageInput = GetMessageInput;

export type ListMessageFilterByDateCreated = {
  created: string;
};

export type ListMessageFilterByStartDate = {
  startDate: string;
};
export type ListMessageFilterByEndDate = {
  endDate: string;
};

export type ListMessageFilterByDateRange = {
  startDate: string;
  endDate: string;
};

export type ListMessageFilters = {
  dialogueId: string;

  order?: "desc" | "asc";
  limit?: number;
  next?: string;
} & (
  | ListMessageFilterByDateCreated
  | ListMessageFilterByStartDate
  | ListMessageFilterByEndDate
  | ListMessageFilterByDateRange
  | {}
);
