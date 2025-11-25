export type MessageContent = string | Record<string, any> | Record<string, any>[];

export interface IMessage {
  id: string;
  dialogueId: string;
  role: string;
  content: MessageContent;
  created: string;

  name?: string;
  metadata?: Record<string, string | number | boolean>;
  tags?: string[];
}

export interface CreateMessageInput {
  dialogueId: string;
  role: string;
  content: MessageContent;
  id?: string;
  name?: string;
  tags?: string[];
  metadata?: Record<string, string | number | boolean>;
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
