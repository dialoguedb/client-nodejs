import { Command } from "commander";
import { createDialogue } from "../methods/createDialogue";
import { getDialogue } from "../methods/getDialogue";
import { getOrCreateDialogue } from "../methods/getOrCreateDialogue";
import { listDialogues } from "../methods/listDialogues";
import * as dialogueApi from "../api/dialogue";
import {
  output,
  parseCSV,
  parseIntStrict,
  parseJSON,
  withErrorHandler,
} from "./shared";

export function registerDialogueCommands(program: Command): void {
  const dialogue = program.command("dialogue").description("Manage dialogues");

  dialogue
    .command("create")
    .description("Create a new dialogue")
    .option("--namespace <namespace>", "Namespace")
    .option("--label <label>", "Label")
    .option("--thread-of <id>", "Parent dialogue ID (creates a thread)")
    .option("--state <json>", "Initial state (JSON)")
    .option("--metadata <json>", "Metadata (JSON object of primitives)")
    .option("--tags <csv>", "Tags (comma-separated)")
    .action(
      withErrorHandler(async (opts) => {
        const d = await createDialogue({
          ...(opts.namespace && { namespace: opts.namespace }),
          ...(opts.label && { label: opts.label }),
          ...(opts.threadOf && { threadOf: opts.threadOf }),
          ...(opts.state && {
            state: parseJSON("state", opts.state) as Record<string, any>,
          }),
          ...(opts.metadata && {
            metadata: parseJSON("metadata", opts.metadata) as Record<
              string,
              string | number | boolean
            >,
          }),
          ...(opts.tags && { tags: parseCSV(opts.tags) }),
        });
        output(d.toJSON());
      })
    );

  dialogue
    .command("get <id>")
    .description("Get a dialogue by ID")
    .option("--namespace <namespace>", "Namespace")
    .action(
      withErrorHandler(async (id: string, opts) => {
        const d = await getDialogue({
          id,
          ...(opts.namespace && { namespace: opts.namespace }),
        });
        if (!d) {
          process.stderr.write(`Dialogue ${id} not found\n`);
          process.exit(1);
        }
        output(d.toJSON());
      })
    );

  dialogue
    .command("get-or-create")
    .description("Get an existing dialogue by ID, or create one")
    .option("--id <id>", "Dialogue ID (if omitted, always creates)")
    .option("--namespace <namespace>", "Namespace")
    .option("--thread-of <id>", "Parent dialogue ID")
    .action(
      withErrorHandler(async (opts) => {
        const d = await getOrCreateDialogue({
          ...(opts.id && { id: opts.id }),
          ...(opts.namespace && { namespace: opts.namespace }),
          ...(opts.threadOf && { threadOf: opts.threadOf }),
        });
        output(d.toJSON());
      })
    );

  dialogue
    .command("list")
    .description("List dialogues")
    .option("--namespace <namespace>", "Namespace")
    .option("--limit <n>", "Limit")
    .option("--order <asc|desc>", "Sort order")
    .option("--thread-of <id>", "Filter by parent dialogue ID")
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
        if (opts.threadOf) filters.threadOf = opts.threadOf;
        if (opts.created) filters.created = opts.created;
        if (opts.startDate) filters.startDate = opts.startDate;
        if (opts.endDate) filters.endDate = opts.endDate;
        if (opts.next) filters.next = opts.next;
        const res = await listDialogues(filters as any);
        output(res);
      })
    );

  dialogue
    .command("delete <id>")
    .description("Delete a dialogue by ID")
    .option("--namespace <namespace>", "Namespace")
    .action(
      withErrorHandler(async (id: string, opts) => {
        await dialogueApi.remove({
          id,
          ...(opts.namespace && { namespace: opts.namespace }),
        });
        output({ deleted: id });
      })
    );

  dialogue
    .command("end <id>")
    .description("End/close a dialogue")
    .option("--namespace <namespace>", "Namespace")
    .action(
      withErrorHandler(async (id: string, opts) => {
        const d = await getDialogue({
          id,
          ...(opts.namespace && { namespace: opts.namespace }),
        });
        if (!d) {
          process.stderr.write(`Dialogue ${id} not found\n`);
          process.exit(1);
        }
        await d.end();
        output(d.toJSON());
      })
    );

  dialogue
    .command("compact <id>")
    .description("Compact/summarize a dialogue (not yet implemented)")
    .option("--namespace <namespace>", "Namespace")
    .action(
      withErrorHandler(async (id: string, opts) => {
        const d = await getDialogue({
          id,
          ...(opts.namespace && { namespace: opts.namespace }),
        });
        if (!d) {
          process.stderr.write(`Dialogue ${id} not found\n`);
          process.exit(1);
        }
        const result = await d.compact();
        output(result);
      })
    );

  dialogue
    .command("update-state <id>")
    .description("Merge keys into dialogue state")
    .requiredOption("--state <json>", "State (JSON object)")
    .option("--namespace <namespace>", "Namespace")
    .action(
      withErrorHandler(async (id: string, opts) => {
        const d = await getDialogue({
          id,
          ...(opts.namespace && { namespace: opts.namespace }),
        });
        if (!d) {
          process.stderr.write(`Dialogue ${id} not found\n`);
          process.exit(1);
        }
        await d.saveState(
          parseJSON("state", opts.state) as Record<string, any>
        );
        output(d.toJSON());
      })
    );

  dialogue
    .command("update-tags <id>")
    .description("Replace dialogue tags")
    .requiredOption("--tags <csv>", "Tags (comma-separated)")
    .option("--namespace <namespace>", "Namespace")
    .action(
      withErrorHandler(async (id: string, opts) => {
        const d = await getDialogue({
          id,
          ...(opts.namespace && { namespace: opts.namespace }),
        });
        if (!d) {
          process.stderr.write(`Dialogue ${id} not found\n`);
          process.exit(1);
        }
        await d.saveTags(parseCSV(opts.tags));
        output(d.toJSON());
      })
    );

  dialogue
    .command("create-thread <id>")
    .description("Create a child thread of a dialogue")
    .option("--label <label>", "Thread label")
    .option("--namespace <namespace>", "Namespace")
    .action(
      withErrorHandler(async (id: string, opts) => {
        const parent = await getDialogue({
          id,
          ...(opts.namespace && { namespace: opts.namespace }),
        });
        if (!parent) {
          process.stderr.write(`Dialogue ${id} not found\n`);
          process.exit(1);
        }
        const thread = await parent.createThread({
          ...(opts.label && { label: opts.label }),
        });
        output(thread.toJSON());
      })
    );

  dialogue
    .command("get-threads <id>")
    .description("Get all child threads of a dialogue")
    .option("--namespace <namespace>", "Namespace")
    .action(
      withErrorHandler(async (id: string, opts) => {
        const parent = await getDialogue({
          id,
          ...(opts.namespace && { namespace: opts.namespace }),
        });
        if (!parent) {
          process.stderr.write(`Dialogue ${id} not found\n`);
          process.exit(1);
        }
        const threads = await parent.getThreads();
        output(threads.map((t) => t.toJSON()));
      })
    );
}
