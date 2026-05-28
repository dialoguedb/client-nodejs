import { IMessage, CreateMessageInput } from "./message";

export interface IDialogue {
  id: string;
  projectId: string;
  requestId: string;
  status: "active" | "ended" | "archived";

  // Optional fields - only present if set
  namespace?: string;
  threadOf?: string;
  label?: string;
  archivedAt?: string;
  endedAt?: string;
  totalMessages?: number;
  threadCount?: number;
  lastMessageCreated?: string;

  // Populated fields - may or may not be present depending on request
  state?: Record<string, any>;
  messages?: IMessage[];

  metadata?: Record<string, string | number | boolean | string[]>;
  tags: string[];

  created: string;
  modified: string;
}

export type CreateDialogueInput = {
  id?: string;
  namespace?: string;
  threadOf?: string;
  label?: string;
  messages?: Omit<CreateMessageInput, "dialogueId">[];
  message?: Omit<CreateMessageInput, "dialogueId">;
  created?: string;
  state?: Record<string, any>;
  metadata?: Record<string, string | number | boolean | string[]>;
  tags?: string[];
};

export type UpdateDialogueInput = {
  id: string;
  namespace?: string;
  label?: string;
  messages?: Omit<CreateMessageInput, "dialogueId">[];
  message?: Omit<CreateMessageInput, "dialogueId">;
  state?: Record<string, any>;
  tags?: string[];
};

export type GetDialogueInput = {
  id: string;
  namespace?: string;
};

export type DeleteDialogueInput = GetDialogueInput;

export type ListDialogueFilterByDateCreated = {
  created: string;
};

export type ListDialogueFilterByStartDate = {
  startDate: string;
};

export type ListDialogueFilterByEndDate = {
  endDate: string;
};

export type ListDialogueFilterByDateRange = {
  startDate: string;
  endDate: string;
};

export type ListDialogueFilters = {
  threadOf?: string;
  namespace?: string;

  order?: "desc" | "asc";
  limit?: number;
  next?: string;
} & (
  | ListDialogueFilterByDateCreated
  | ListDialogueFilterByStartDate
  | ListDialogueFilterByEndDate
  | ListDialogueFilterByDateRange
  | {}
);

export type UseDialogueInput = {
  id?: string;
  namespace?: string;
  threadOf?: string;
};
