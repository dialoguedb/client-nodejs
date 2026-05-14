import { Command } from "commander";
import {
  searchDialogues,
  searchMessages,
  searchMemories,
} from "../methods/search";
import {
  output,
  parseCSV,
  parseIntStrict,
  parseJSON,
  withErrorHandler,
} from "./shared";

function commonSearchOptions(cmd: Command): Command {
  return cmd
    .option("--namespace <namespace>", "Namespace")
    .option("--limit <n>", "Limit")
    .option("--tags <csv>", "Filter by tags (comma-separated)")
    .option("--metadata <json>", "Filter by metadata (JSON)")
    .option(
      "--filter <json>",
      "Date/created/modified filter (JSON of SearchFilterOptions)"
    );
}

function buildSearchOptions(opts: any): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  if (opts.namespace) o.namespace = opts.namespace;
  if (opts.limit) o.limit = parseIntStrict("limit", opts.limit);
  if (opts.tags) o.tags = parseCSV(opts.tags);
  if (opts.metadata) o.metadata = parseJSON("metadata", opts.metadata);
  if (opts.filter) o.filter = parseJSON("filter", opts.filter);
  return o;
}

export function registerSearchCommands(program: Command): void {
  const search = program.command("search").description("Semantic search");

  commonSearchOptions(
    search
      .command("dialogues <query>")
      .description("Search dialogues by semantic query")
  ).action(
    withErrorHandler(async (query: string, opts) => {
      const results = await searchDialogues(query, buildSearchOptions(opts));
      output(results.map((d) => d.toJSON()));
    })
  );

  commonSearchOptions(
    search
      .command("messages <query>")
      .description("Search messages by semantic query")
  ).action(
    withErrorHandler(async (query: string, opts) => {
      const results = await searchMessages(query, buildSearchOptions(opts));
      output(results);
    })
  );

  commonSearchOptions(
    search
      .command("memories <query>")
      .description("Search memories by semantic query")
  ).action(
    withErrorHandler(async (query: string, opts) => {
      const results = await searchMemories(query, buildSearchOptions(opts));
      output(results);
    })
  );
}
