import { readFile, stat } from "node:fs/promises";
import { DialogueDBError } from "../errors";
import { getDialogue } from "../methods/getDialogue";
import type {
  ImagePart,
  ImageMediaType,
  MessageContent,
} from "../types/message";

/**
 * Upper bound on a local image read from `--image`. Not a policy limit (the
 * server enforces the per-plan maxImageBytes on the decoded bytes); this only
 * keeps the CLI from loading an absurd file into memory and running out of heap.
 */
const MAX_IMAGE_FILE_BYTES = 20 * 1024 * 1024;

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

export async function loadDialogueOrExit(id: string, namespace?: string) {
  const d = await getDialogue({
    id,
    ...(namespace && { namespace }),
  });
  if (!d) {
    process.stderr.write(`Dialogue ${id} not found\n`);
    process.exit(1);
  }
  return d;
}

export async function resolveContent(opts: {
  content?: string;
  stdin?: boolean;
}): Promise<string | undefined> {
  if (opts.stdin) return (await readStdin()).trimEnd();
  return opts.content;
}

const IMAGE_EXTENSION_MEDIA_TYPES: Record<string, ImageMediaType> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export function mediaTypeForImagePath(filePath: string): ImageMediaType {
  const dot = filePath.lastIndexOf(".");
  const extension = dot === -1 ? "" : filePath.slice(dot).toLowerCase();
  const mediaType = IMAGE_EXTENSION_MEDIA_TYPES[extension];
  if (!mediaType) {
    throw new Error(
      `--image: unsupported file extension "${extension || filePath}". ` +
        `Supported: .jpg, .jpeg, .png, .gif, .webp`
    );
  }
  return mediaType;
}

/**
 * An http(s) argument becomes a url-origin part: DialogueDB stores and returns
 * the URL verbatim and never re-hosts it. Anything else is read off disk and
 * inlined as base64.
 */
export async function buildImagePart(source: string): Promise<ImagePart> {
  if (/^https?:\/\//i.test(source)) {
    return { type: "image", source: { type: "url", url: source } };
  }
  const mediaType = mediaTypeForImagePath(source);
  // Guard the read: the server enforces the real per-plan limit, this only
  // stops the CLI loading an oversized file into memory and exhausting heap.
  const { size } = await stat(source);
  if (size > MAX_IMAGE_FILE_BYTES) {
    throw new Error(
      `--image: "${source}" is ${Math.round(
        size / (1024 * 1024)
      )}MB, over the ${
        MAX_IMAGE_FILE_BYTES / (1024 * 1024)
      }MB limit for reading an image from disk`
    );
  }
  const bytes = await readFile(source);
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: mediaType,
      data: bytes.toString("base64"),
    },
  };
}

export function composeMessageContent(
  text: string | undefined,
  imagePart: ImagePart | undefined
): MessageContent {
  if (imagePart && text !== undefined) {
    return [{ type: "text", text }, imagePart];
  }
  if (imagePart) {
    return [imagePart];
  }
  if (text !== undefined) {
    return text;
  }
  throw new Error(
    "Provide --content <text>, --content-json <json>, --stdin, or --image <path|url>"
  );
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
