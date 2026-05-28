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
    .option("--tags <csv>", "Filter by tags (comma-separated, $in semantics)")
    .option(
      "--tags-json <json>",
      "Filter by tags using operator object (JSON: { $in?, $all?, $nin? })"
    )
    .option("--metadata <json>", "Filter by metadata (JSON)")
    .option(
      "--filter <json>",
      "Date filter (JSON: { created?: string|range, modified?: string|range })"
    )
    .option(
      "--timezone <iana>",
      "IANA timezone for natural-language date phrases in --filter (default UTC)"
    )
    .option(
      "--order-by <field>",
      "Order by: relevance | created | modified (default relevance)"
    )
    .option("--order <dir>", "Order direction: asc | desc (default desc)");
}

function buildSearchOptions(opts: any): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  if (opts.namespace) o.namespace = opts.namespace;
  if (opts.limit) o.limit = parseIntStrict("limit", opts.limit);
  if (opts.tagsJson) {
    o.tags = parseJSON("tags-json", opts.tagsJson);
  } else if (opts.tags) {
    o.tags = parseCSV(opts.tags);
  }
  if (opts.metadata) o.metadata = parseJSON("metadata", opts.metadata);
  if (opts.filter) o.filter = parseJSON("filter", opts.filter);
  if (opts.timezone) o.timezone = opts.timezone;
  if (opts.orderBy) o.orderBy = opts.orderBy;
  if (opts.order) o.order = opts.order;
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
      const response = await searchDialogues(query, buildSearchOptions(opts));
      output(response);
    })
  );

  commonSearchOptions(
    search
      .command("messages <query>")
      .description("Search messages by semantic query")
  ).action(
    withErrorHandler(async (query: string, opts) => {
      const response = await searchMessages(query, buildSearchOptions(opts));
      output(response);
    })
  );

  commonSearchOptions(
    search
      .command("memories <query>")
      .description("Search memories by semantic query")
  ).action(
    withErrorHandler(async (query: string, opts) => {
      const response = await searchMemories(query, buildSearchOptions(opts));
      output(response);
    })
  );
}
