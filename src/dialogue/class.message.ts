import { IMessage } from "@/types";
import * as messageApi from "@/api/message";
import {
  Settings,
  SettingsContainer,
} from "@/settings/class.SettingsContainer";
import { useSettings } from "@/settings/useSettings";
import { isPlainObject } from "@/utils/lodash";
import { inspect } from "util";
import { errors } from "@/errors";

export interface MessageOptions {
  onRemoved?: () => void;
}

export class Message {
  #id: string;
  #dialogueId: string;
  #namespace?: string;
  #role: string;
  #content: IMessage["content"];
  #created: string;

  // Optional fields
  #name?: string;
  #metadata?: Record<string, string | number | boolean | string[]>;
  #tags: string[] = [];

  #isDirty = false;
  #settings: SettingsContainer;
  #onRemoved?: () => void;

  constructor(
    dialogueId: string,
    message: IMessage,
    settings?: SettingsContainer | Partial<Settings>,
    options?: MessageOptions & { namespace?: string }
  ) {
    this.#settings = useSettings(settings);
    this.#onRemoved = options?.onRemoved;
    this.#namespace = options?.namespace;

    if (!dialogueId || typeof dialogueId !== "string") {
      throw errors.invalidParameter(
        "dialogueId",
        "is required and must be a string"
      );
    }
    this.#dialogueId = dialogueId;

    this.#setProperties(message);
  }

  #setProperties(message: IMessage): void {
    // Required fields
    if (!message?.id || typeof message.id !== "string") {
      throw errors.invalidParameter("id", "is required and must be a string");
    }
    this.#id = message.id;

    if (!message.role || typeof message.role !== "string") {
      throw errors.invalidParameter("role", "is required and must be a string");
    }
    this.#role = message.role;

    // Content - can be string or structured
    this.#content = message.content ?? "";

    // Timestamp
    const now = new Date().toISOString();
    this.#created = typeof message.created === "string" ? message.created : now;

    // Optional fields
    if (typeof message.name === "string") {
      this.#name = message.name;
    }

    if (isPlainObject(message.metadata)) {
      this.#metadata = structuredClone(message.metadata);
    }

    if (Array.isArray(message.tags)) {
      if (message.tags.every((a) => typeof a === "string")) {
        this.#tags = [...message.tags];
      } else {
        throw errors.invalidParameter("tags", "must be array of strings");
      }
    }
  }

  get id(): string {
    return this.#id;
  }

  get role(): Readonly<IMessage["role"]> {
    return this.#role;
  }

  get content(): Readonly<IMessage["content"]> {
    return this.#content;
  }

  get name(): string | undefined {
    return this.#name;
  }

  get metadata():
    | Readonly<Record<string, string | number | boolean | string[]>>
    | undefined {
    return this.#metadata ? structuredClone(this.#metadata) : undefined;
  }

  get created(): string {
    return this.#created;
  }

  get tags(): string[] {
    return [...this.#tags];
  }

  set tags(value: string[]) {
    if (!Array.isArray(value)) {
      throw errors.invalidParameter("tags", "must be an array");
    }
    if (!value.every((t) => typeof t === "string")) {
      throw errors.invalidParameter("tags", "must be array of strings");
    }
    this.#tags = [...value];
    this.#isDirty = true;
  }

  get isDirty(): boolean {
    return this.#isDirty;
  }

  /**
   * Set tags and save immediately
   */
  async saveTags(tags: string[]): Promise<void> {
    this.tags = tags;
    await this.save();
  }

  /**
   * Save pending changes to the API
   */
  async save(): Promise<void> {
    if (!this.#isDirty) return;

    const updated = await messageApi.update(
      {
        dialogueId: this.#dialogueId,
        id: this.#id,
        tags: this.#tags,
        ...(this.#namespace !== undefined && { namespace: this.#namespace }),
      },
      this.#settings
    );

    this.#tags = updated.tags ?? [];
    this.#isDirty = false;
  }

  async remove(): Promise<void> {
    await messageApi.remove(
      {
        dialogueId: this.#dialogueId,
        id: this.id,
        ...(this.#namespace !== undefined && { namespace: this.#namespace }),
      },
      this.#settings
    );
    this.#onRemoved?.();
  }

  toJSON() {
    return {
      id: this.#id,
      role: this.#role,
      content: this.#content,
      created: this.#created,
      ...(this.#name !== undefined && { name: this.#name }),
      ...(this.#metadata !== undefined && {
        metadata: structuredClone(this.#metadata),
      }),
      ...(this.#tags.length > 0 && { tags: [...this.#tags] }),
    };
  }

  [inspect.custom]() {
    return this.toJSON();
  }
}
