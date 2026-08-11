import type {
  MessageContent,
  ContentPart,
  ImagePart,
  TextPart,
  ImageMediaType,
} from "./message";
import type { Dialogue } from "@/dialogue/class.dialogue";

// These are compile-time assertions: ts-jest type-checks this file, so any
// assignment the public types reject fails the suite.

const anthropicBase64Image: ImagePart = {
  type: "image",
  source: { type: "base64", media_type: "image/png", data: "iVBORw0KGgo=" },
};

const anthropicUrlImage: ImagePart = {
  type: "image",
  source: { type: "url", url: "https://example.com/photo.png" },
};

const openAiImage: ImagePart = {
  type: "image_url",
  image_url: { url: "data:image/png;base64,iVBORw0KGgo=" },
};

const textPart: TextPart = { type: "text", text: "what is in this image?" };

// Unrecognized parts must still typecheck: the API stores them untouched.
const toolUsePart: ContentPart = {
  type: "tool_use",
  id: "call_1",
  name: "get_weather",
  input: { location: "SF" },
};

const mediaType: ImageMediaType = "image/png";

const multipart: MessageContent = [textPart, anthropicBase64Image, toolUsePart];
const stringContent: MessageContent = "hello";
const objectContent: MessageContent = { type: "structured_output", data: {} };
const legacyArrayContent: MessageContent = [{ anything: true }];

// saveMessages must accept the same content as saveMessage, including image parts.
type SaveMessagesItem = Parameters<Dialogue["saveMessages"]>[0][number];
const batchedImageMessage: SaveMessagesItem = {
  role: "user",
  content: [textPart, openAiImage],
};

describe("MessageContent", () => {
  it("accepts the Anthropic image spelling for base64 and url sources", () => {
    expect(anthropicBase64Image.type).toBe("image");
    expect(anthropicUrlImage.type).toBe("image");
  });

  it("accepts the OpenAI image_url spelling", () => {
    expect(openAiImage.type).toBe("image_url");
    expect(openAiImage.image_url.url.startsWith("data:")).toBe(true);
  });

  it("accepts string, object, and array content alongside typed parts", () => {
    expect(textPart.text).toContain("image");
    expect(toolUsePart).toHaveProperty("id", "call_1");
    expect(mediaType).toBe("image/png");
    expect(multipart).toHaveLength(3);
    expect(stringContent).toBe("hello");
    expect(objectContent).toHaveProperty("type");
    expect(legacyArrayContent).toHaveLength(1);
  });

  it("lets saveMessages take an image part in a batch", () => {
    expect(batchedImageMessage.content).toHaveLength(2);
  });
});
