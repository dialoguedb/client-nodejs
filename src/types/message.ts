/**
 * Media types DialogueDB recognizes as an image. A part with any other media
 * type is still accepted, stored, and returned exactly as you sent it; it just
 * is not treated as an image by image-aware features such as search.
 */
export type ImageMediaType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp";

export interface TextPart {
  type: "text";
  text: string;
  [key: string]: unknown;
}

/** Anthropic: inline base64 bytes. `data` is raw base64, no `data:` prefix. */
export interface AnthropicBase64ImageSource {
  type: "base64";
  media_type: ImageMediaType;
  data: string;
}

/** Anthropic: a remote URL. Stored and returned exactly as you send it, so the URL must stay reachable for anyone who later reads the message. */
export interface AnthropicUrlImageSource {
  type: "url";
  url: string;
  media_type?: ImageMediaType;
}

export type AnthropicImageSource =
  | AnthropicBase64ImageSource
  | AnthropicUrlImageSource;

export interface AnthropicImagePart {
  type: "image";
  source: AnthropicImageSource;
  [key: string]: unknown;
}

/** OpenAI: `url` is either an http(s) URL or a `data:<media-type>;base64,...` URI. */
export interface OpenAIImagePart {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
  [key: string]: unknown;
}

export type ImagePart = AnthropicImagePart | OpenAIImagePart;

/**
 * A single element of array content.
 *
 * The `Record<string, any>` member keeps the type open: blocks DialogueDB does
 * not recognize (tool_use, tool_result, document, anything custom) are stored
 * and returned untouched, so you can send whatever your model provider emits.
 * The named members exist for editor completion on the two provider spellings.
 */
export type ContentPart = TextPart | ImagePart | Record<string, any>;

export type MessageContent = string | Record<string, any> | ContentPart[];

export interface IMessage {
  id: string;
  dialogueId: string;
  role: string;
  content: MessageContent;
  created: string;
  modified: string;
  metadata: Record<string, string | number | boolean | string[]>;
  tags: string[];

  name?: string;
}

export interface CreateMessageInput {
  dialogueId: string;
  role: string;
  content: MessageContent;
  id?: string;
  name?: string;
  namespace?: string;
  tags?: string[];
  metadata?: Record<string, string | number | boolean | string[]>;
  created?: string;
}

export type GetMessageInput = {
  id: string;
  dialogueId: string;
  namespace?: string;
};

export type DeleteMessageInput = GetMessageInput;

export type ListMessageFilterByDateCreated = {
  created: string;
};

export type ListMessageFilterByStartDate = {
  startDate: string;
};
export type ListMessageFilterByEndDate = {
  endDate: string;
};

export type ListMessageFilterByDateRange = {
  startDate: string;
  endDate: string;
};

export type ListMessageFilters = {
  dialogueId: string;
  namespace?: string;

  order?: "desc" | "asc";
  limit?: number;
  next?: string;
} & (
  | ListMessageFilterByDateCreated
  | ListMessageFilterByStartDate
  | ListMessageFilterByEndDate
  | ListMessageFilterByDateRange
  | {}
);
