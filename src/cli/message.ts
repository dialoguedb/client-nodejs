import { Command } from "commander";
import { readFile } from "node:fs/promises";
import {
  buildImagePart,
  composeMessageContent,
  loadDialogueOrExit,
  output,
  parseCSV,
  parseIntStrict,
  parseJSON,
  resolveContent,
  withErrorHandler,
} from "./shared";

export function registerMessageCommands(program: Command): void {
  const message = program
    .command("message")
    .description("Manage messages within a dialogue");

  message
    .command("add <dialogueId>")
    .description("Add a message to a dialogue")
    .requiredOption("--role <role>", "Message role (e.g. user, assistant)")
    .option("--content <content>", "Message content (string)")
    .option("--content-json <json>", "Message content (JSON)")
    .option("--stdin", "Read content from stdin")
    .option(
      "--image <path|url>",
      "Attach an image. A local path is inlined as base64; an http(s) URL is stored verbatim. Combines with --content or --stdin."
    )
    .option("--name <name>", "Optional name")
    .option("--namespace <namespace>", "Namespace")
    .option("--tags <csv>", "Tags (comma-separated)")
    .action(
      withErrorHandler(async (dialogueId: string, opts) => {
        const d = await loadDialogueOrExit(dialogueId, opts.namespace);

        let content: unknown;
        if (opts.contentJson) {
          if (opts.image) {
            throw new Error(
              "--image cannot be combined with --content-json; put the image part in the JSON instead"
            );
          }
          content = parseJSON("content-json", opts.contentJson);
        } else {
          const text = await resolveContent({
            content: opts.content,
            stdin: opts.stdin,
          });
          const imagePart = opts.image
            ? await buildImagePart(opts.image)
            : undefined;
          content = composeMessageContent(text, imagePart);
        }

        const msg = await d.saveMessage({
          role: opts.role,
          content: content as any,
          ...(opts.name && { name: opts.name }),
          ...(opts.tags && { tags: parseCSV(opts.tags) }),
        });
        output(msg);
      })
    );

  message
    .command("add-batch <dialogueId>")
    .description("Add multiple messages from a JSON file")
    .requiredOption(
      "--file <path>",
      "Path to JSON file containing array of {role, content}"
    )
    .option("--namespace <namespace>", "Namespace")
    .action(
      withErrorHandler(async (dialogueId: string, opts) => {
        const d = await loadDialogueOrExit(dialogueId, opts.namespace);
        const raw = await readFile(opts.file, "utf8");
        const messages = parseJSON("file", raw);
        if (!Array.isArray(messages)) {
          throw new Error(
            `--file must contain a JSON array, got ${typeof messages}`
          );
        }
        const saved = await d.saveMessages(messages as any);
        output(saved);
      })
    );

  message
    .command("list <dialogueId>")
    .description("List messages in a dialogue")
    .option("--limit <n>", "Limit")
    .option("--order <asc|desc>", "Sort order")
    .option("--namespace <namespace>", "Namespace")
    .option("--next-page", "Append next page using cached cursor")
    .action(
      withErrorHandler(async (dialogueId: string, opts) => {
        const d = await loadDialogueOrExit(dialogueId, opts.namespace);
        const filters: Record<string, unknown> = {};
        if (opts.limit) filters.limit = parseIntStrict("limit", opts.limit);
        if (opts.order) filters.order = opts.order;
        if (opts.nextPage) filters.next = true;
        const items = await d.loadMessages(filters as any);
        output(items);
      })
    );

  message
    .command("get <dialogueId> <messageId>")
    .description("Get a single message by ID")
    .option("--namespace <namespace>", "Namespace")
    .action(
      withErrorHandler(async (dialogueId: string, messageId: string, opts) => {
        const d = await loadDialogueOrExit(dialogueId, opts.namespace);
        const msg = await d.getMessage(messageId);
        output(msg);
      })
    );

  message
    .command("delete <dialogueId> <messageId>")
    .description("Delete a message by ID")
    .option("--namespace <namespace>", "Namespace")
    .action(
      withErrorHandler(async (dialogueId: string, messageId: string, opts) => {
        const d = await loadDialogueOrExit(dialogueId, opts.namespace);
        await d.deleteMessage(messageId);
        output({ deleted: messageId });
      })
    );
}
