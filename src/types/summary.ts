export interface ISummary {
  id: string;
  dialogueId: string;
  projectId: string;
  status: "processing" | "completed" | "failed";

  // Optional — present depending on status / configuration.
  namespace?: string;
  jobId?: string;
  error?: string;

  // What produced it.
  provider?: string;
  model?: string;
  /** Slug of the summary_template used, if any. */
  template?: string;

  // The summary text (null/absent until completed; null when nothing to summarize).
  content?: string | null;
  contentTokenCount?: number;

  // Coverage of the summarized range.
  fromCreated?: string;
  toCreated?: string;
  messageCount?: number;
  summarizedCount?: number;
  skippedCount?: number;

  // Stats. `totalTokens` is a source-text estimate; the `llm*` fields are the
  // actual provider-reported usage (use those for cost).
  totalTokens?: number;
  chunks?: number;
  llmInputTokens?: number;
  llmOutputTokens?: number;
  llmTotalTokens?: number;
  llmCallCount?: number;

  metadata?: Record<string, string | number | boolean | string[]>;
  tags?: string[];

  created: string;
  modified: string;
}

export type SummarizeInput = {
  dialogueId: string;
  namespace?: string;
  /** Slug of a configured summary_template whose prompt drives this summarization. */
  template?: string;
  /** Optional caller-supplied summary id. */
  id?: string;
  /** Restrict the summarized range to messages between these message ids. */
  startId?: string;
  endId?: string;
};

/** Options for `dialogue.summarize()` (dialogueId/namespace come from the instance). */
export type SummarizeOptions = Omit<SummarizeInput, "dialogueId" | "namespace">;
