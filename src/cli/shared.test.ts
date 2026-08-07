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
    // Math.round rendered anything under x.5MB as "is 20MB, over the 20MB
    // limit", which reads like the check itself is broken.
    //
    // Sized off the constant rather than a literal: written as `20 * 1024 *
    // 1024 + 100 * 1024` this kept passing after the ceiling moved, because it
    // was still over the OLD limit and the assertion still matched the old
    // number. A test that follows the constant fails when they disagree.
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
    // This is a heap guard, not a policy limit. Below the server's cap it
    // silently becomes the stricter of the two, rejecting images the API
    // would accept and blaming disk reads for it.
    const MAX_PLAN_IMAGE_BYTES = 25_000_000;
    expect(MAX_IMAGE_FILE_BYTES).toBeGreaterThan(MAX_PLAN_IMAGE_BYTES);
  });

  it("accepts a file the server would accept", async () => {
    // The regression in one case: 22 MB is under the 25,000,000 plan cap and
    // was over the old 20 MiB client ceiling.
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
