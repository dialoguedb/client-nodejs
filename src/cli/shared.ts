import { DialogueDBError } from "../errors";
import { getDialogue } from "../methods/getDialogue";

export function parseJSON(label: string, raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(`--${label} is not valid JSON: ${message}`);
  }
}

export function parseCSV(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function parseIntStrict(label: string, raw: string): number {
  const n = Number(raw);
  if (!Number.isInteger(n)) {
    throw new Error(`--${label} must be an integer, got "${raw}"`);
  }
  return n;
}

export async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    throw new Error(
      "--stdin was passed but stdin is a terminal (no piped input detected)"
    );
  }
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Loads a dialogue, or exits non-zero. A miss throws a DialogueDBError, which
 * withErrorHandler reports and exits on — so the CLI prints the namespace hint
 * and requestId rather than a bare "not found".
 */
export async function loadDialogueOrExit(id: string, namespace?: string) {
  return getDialogue({
    id,
    ...(namespace && { namespace }),
  });
}

export async function resolveContent(opts: {
  content?: string;
  stdin?: boolean;
}): Promise<string> {
  if (opts.stdin) return (await readStdin()).trimEnd();
  if (opts.content !== undefined) return opts.content;
  throw new Error("Provide --content <text> or --stdin");
}

export function output(value: unknown): void {
  process.stdout.write(JSON.stringify(value, null, 2) + "\n");
}

export function withErrorHandler<A extends unknown[]>(
  fn: (...args: A) => Promise<void>
) {
  return async (...args: A): Promise<void> => {
    try {
      await fn(...args);
    } catch (e) {
      if (e instanceof DialogueDBError) {
        process.stderr.write(
          JSON.stringify(
            {
              error: e.message,
              code: e.code,
              type: e.type,
              statusCode: e.statusCode,
              requestId: e.requestId,
              details: e.details,
            },
            null,
            2
          ) + "\n"
        );
      } else {
        process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
      }
      process.exit(1);
    }
  };
}
