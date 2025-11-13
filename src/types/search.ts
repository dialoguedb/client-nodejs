export type SearchFilters = {
  query: string;
  object: "memory" | "dialogue" | "message";

  namespace?: string;
  dialogueId?: string;

  tags?: string[];
  limit?: number;
};
