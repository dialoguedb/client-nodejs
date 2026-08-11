import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  mediaTypeForImagePath,
  buildImagePart,
  MAX_IMAGE_FILE_BYTES,
  composeMessageContent,
} from "./shared";

describe("mediaTypeForImagePath", () => {
  it.each([
    ["photo.png", "image/png"],
    ["photo.PNG", "image/png"],
    ["photo.jpg", "image/jpeg"],
    ["photo.jpeg", "image/jpeg"],
    ["photo.gif", "image/gif"],
    ["photo.webp", "image/webp"],
  ])("maps %s to %s", (path, expected) => {
    expect(mediaTypeForImagePath(path)).toBe(expected);
  });

  it("rejects an unsupported extension", () => {
    expect(() => mediaTypeForImagePath("scan.tiff")).toThrow(
      '--image: unsupported file extension ".tiff". Supported: .jpg, .jpeg, .png, .gif, .webp'
    );
  });

  it("rejects a file with no extension", () => {
    expect(() => mediaTypeForImagePath("screenshot")).toThrow(
      "--image: unsupported file extension"
    );
  });
});

describe("buildImagePart", () => {
  let dir: string;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), "ddb-cli-"));
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("passes an http(s) source through as a url-origin part", async () => {
    await expect(buildImagePart("https://example.com/a.png")).resolves.toEqual({
      type: "image",
      source: { type: "url", url: "https://example.com/a.png" },
    });
  });

  it("reports a fractional size when a file is just over the limit", async () => {
    // Both the file size and the expected string are derived from
    // MAX_IMAGE_FILE_BYTES, so this test tracks the limit instead of pinning a
    // literal that can silently drift away from it.
    const overBy = 100 * 1024;
    const file = join(dir, "big.png");
    await writeFile(file, Buffer.alloc(MAX_IMAGE_FILE_BYTES + overBy));

    const expected = ((MAX_IMAGE_FILE_BYTES + overBy) / (1024 * 1024)).toFixed(
      1
    );
    await expect(buildImagePart(file)).rejects.toThrow(
      new RegExp(`is ${expected.replace(".", "\\.")}MB`)
    );
  });

  it("stays above the largest per-image cap any plan allows", async () => {
    // The local ceiling is a memory guard, not a policy limit: it has to stay
    // above the largest per-image size any plan allows so the CLI never
    // rejects an image the API would have accepted.
    const MAX_PLAN_IMAGE_BYTES = 25_000_000;
    expect(MAX_IMAGE_FILE_BYTES).toBeGreaterThan(MAX_PLAN_IMAGE_BYTES);
  });

  it("accepts a file the server would accept", async () => {
    // 22 MB is under the 25,000,000-byte per-image plan cap, so the CLI must
    // read the file rather than reject it locally.
    const file = join(dir, "twentytwo.png");
    await writeFile(file, Buffer.alloc(22_000_000));

    await expect(buildImagePart(file)).resolves.toMatchObject({
      type: "image",
      source: { type: "base64" },
    });
  });

  it("reads a local file into a base64 part", async () => {
    const file = join(dir, "pixel.png");
    await writeFile(file, Buffer.from([0x89, 0x50, 0x4e, 0x47]));

    await expect(buildImagePart(file)).resolves.toEqual({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64"),
      },
    });
  });
});

describe("composeMessageContent", () => {
  const imagePart = {
    type: "image" as const,
    source: { type: "url" as const, url: "https://example.com/a.png" },
  };

  it("returns the text alone when there is no image", () => {
    expect(composeMessageContent("hello", undefined)).toBe("hello");
  });

  it("returns a single-element array when there is only an image", () => {
    expect(composeMessageContent(undefined, imagePart)).toEqual([imagePart]);
  });

  it("puts the text before the image when both are given", () => {
    expect(composeMessageContent("what is this?", imagePart)).toEqual([
      { type: "text", text: "what is this?" },
      imagePart,
    ]);
  });

  it("throws when neither is given", () => {
    expect(() => composeMessageContent(undefined, undefined)).toThrow(
      "Provide --content <text>, --content-json <json>, --stdin, or --image <path|url>"
    );
  });
});
