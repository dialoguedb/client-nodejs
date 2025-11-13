import { IMessage, CreateMessageInput } from "./message";

export interface IDialogue {
  id: string;
  namespace?: string;

  canceled?: boolean;

  expired: boolean;
  expiresTimestamp?: number;

  state: Record<string, any>;
  messages: IMessage[];
  metadata: Record<string, string | number | boolean>;
  tags: string[];

  created: string;
  modified: string;
}

export type CreateDialogueInput = {
  id?: string;
  namespace?: string;
  threadOf?: string;
  messages?: Omit<CreateMessageInput, "dialogueId">[];
  message?: Omit<CreateMessageInput, "dialogueId">;
  created?: string;
  state?: Record<string, any>;
  metadata?: Record<string, string | number | boolean>;
  tags?: string[];
  expiresTimestamp?: number; // ?
};

export type UpdateDialogueInput = {
  id: string;
  namespace?: string;
  messages?: Omit<CreateMessageInput, "dialogueId">[];
  message?: Omit<CreateMessageInput, "dialogueId">;
  state?: Record<string, any>;
  tags?: string[];
};

export type GetDialogueInput = {
  id: string;
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
