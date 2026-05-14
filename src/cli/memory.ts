import { Command } from "commander";
import { createMemory } from "../methods/createMemory";
import { getMemory } from "../methods/getMemory";
import * as memoryApi from "../api/memory";
import {
  output,
  parseCSV,
  parseIntStrict,
  parseJSON,
  resolveContent,
  withErrorHandler,
} from "./shared";

export function registerMemoryCommands(program: Command): void {
  const memory = program.command("memory").description("Manage memories");

  memory
    .command("create")
    .description("Create a new memory")
    .option("--value <value>", "Value (string)")
    .option("--value-json <json>", "Value (JSON)")
    .option("--stdin", "Read value from stdin (as string)")
    .option("--id <id>", "Optional memory ID")
    .option("--namespace <namespace>", "Namespace")
    .option("--label <label>", "Label")
    .option("--description <description>", "Description")
    .option("--tags <csv>", "Tags (comma-separated)")
    .option("--metadata <json>", "Metadata (JSON object of primitives)")
    .action(
      withErrorHandler(async (opts) => {
        let value: unknown;
        if (opts.valueJson) {
          value = parseJSON("value-json", opts.valueJson);
        } else {
          value = await resolveContent({
            content: opts.value,
            stdin: opts.stdin,
          });
        }

        const m = await createMemory({
          value: value as any,
          ...(opts.id && { id: opts.id }),
          ...(opts.namespace && { namespace: opts.namespace }),
          ...(opts.label && { label: opts.label }),
          ...(opts.description && { description: opts.description }),
          ...(opts.tags && { tags: parseCSV(opts.tags) }),
          ...(opts.metadata && {
            metadata: parseJSON("metadata", opts.metadata) as Record<
              string,
              string | number | boolean
            >,
          }),
        });
        output(m);
      })
    );

  memory
    .command("get <id>")
    .description("Get a memory by ID")
    .option("--namespace <namespace>", "Namespace")
    .action(
      withErrorHandler(async (id: string, opts) => {
        const m = await getMemory({
          id,
          ...(opts.namespace && { namespace: opts.namespace }),
        });
        if (!m) {
          process.stderr.write(`Memory ${id} not found\n`);
          process.exit(1);
        }
        output(m);
      })
    );

  memory
    .command("list")
    .description("List memories")
    .option("--namespace <namespace>", "Namespace")
    .option("--limit <n>", "Limit")
    .option("--order <asc|desc>", "Sort order")
    .option("--created <date>", "Filter by exact created date")
    .option("--start-date <date>", "Filter by start date")
    .option("--end-date <date>", "Filter by end date")
    .option("--next <token>", "Pagination cursor")
    .action(
      withErrorHandler(async (opts) => {
        const filters: Record<string, unknown> = {};
        if (opts.namespace) filters.namespace = opts.namespace;
        if (opts.limit) filters.limit = parseIntStrict("limit", opts.limit);
        if (opts.order) filters.order = opts.order;
        if (opts.created) filters.created = opts.created;
        if (opts.startDate) filters.startDate = opts.startDate;
        if (opts.endDate) filters.endDate = opts.endDate;
        if (opts.next) filters.next = opts.next;
        const res = await memoryApi.list(filters as any);
        output(res);
      })
    );

  memory
    .command("delete <id>")
    .description("Delete a memory by ID")
    .option("--namespace <namespace>", "Namespace")
    .action(
      withErrorHandler(async (id: string, opts) => {
        await memoryApi.remove({
          id,
          ...(opts.namespace && { namespace: opts.namespace }),
        });
        output({ deleted: id });
      })
    );

  memory
    .command("update <id>")
    .description("Update a memory's tags")
    .requiredOption("--tags <csv>", "Tags (comma-separated)")
    .option("--namespace <namespace>", "Namespace")
    .action(
      withErrorHandler(async (id: string, opts) => {
        const updated = await memoryApi.update({
          id,
          tags: parseCSV(opts.tags),
          ...(opts.namespace && { namespace: opts.namespace }),
        });
        output(updated);
      })
    );
}
