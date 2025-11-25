import { IMessage } from "@/types";
import * as messageApi from "@/api/message";
import {
  Settings,
  SettingsContainer,
} from "@/settings/class.SettingsContainer";
import { useSettings } from "@/settings/useSettings";
import { isPlainObject } from "@/utils/lodash";

export interface MessageOptions {
  onRemoved?: () => void;
}

export class Message {
  #id: string;
  #content: IMessage["content"];
  #role: IMessage["role"];
  #metadata: IMessage["metadata"];
  #created: IMessage["created"];
  #modified: IMessage["modified"];

  #tags: string[] = [];
  #isDirty = false;

  #dialogueId: string;
  #settings: SettingsContainer;
  #onRemoved?: () => void;

  constructor(
    dialogueId: string,
    message: IMessage,
    settings?: SettingsContainer | Settings,
    options?: MessageOptions
  ) {
    this.#settings = useSettings(settings);
    this.#onRemoved = options?.onRemoved;

    if (!dialogueId || typeof dialogueId !== "string") {
      throw new Error("Message dialogueId is required and must be a string");
    }
    this.#dialogueId = dialogueId;

    this.#setProperties(message);
  }

  #setProperties(message: IMessage): void {
    // Required
    if (!message?.id || typeof message.id !== "string") {
      throw new Error("Message id is required and must be a string");
    }
    this.#id = message.id;

    // Role - required, validate type
    if (!message?.role || typeof message.role !== "string") {
      throw new Error("Message role is required and must be a string");
    }
    this.#role = message.role;

    // Content - can be string or structured
    this.#content = message.content ?? "";

    // Timestamps - default to now if missing
    const now = new Date().toISOString();
    this.#created =
      typeof message.created === "string" ? message.created : now;
    this.#modified =
      typeof message.modified === "string" ? message.modified : this.#created;

    // Objects - deep clone
    if (isPlainObject(message.metadata)) {
      this.#metadata = structuredClone(message.metadata);
    }

    if (Array.isArray(message.tags)) {
      if (message.tags.every((a) => typeof a === "string")) {
        this.#tags = [...message.tags];
      } else {
        throw new Error("tags must be array of strings");
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

  get metadata(): Readonly<Record<string, any>> {
    return { ...this.#metadata };
  }

  get created(): IMessage["created"] {
    return this.#created;
  }

  get modified(): IMessage["modified"] {
    return this.#modified;
  }

  get tags(): string[] {
    return this.#tags;
  }

  set tags(value: string[]) {
    this.#tags = value;
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
      { dialogueId: this.#dialogueId, id: this.#id, tags: this.#tags },
      this.#settings
    );

    this.#modified = updated.modified;
    this.#tags = updated.tags ?? [];
    this.#isDirty = false;
  }

  async remove(): Promise<void> {
    await messageApi.remove(
      { dialogueId: this.#dialogueId, id: this.id },
      this.#settings
    );
    this.#onRemoved?.();
  }

  toJSON() {
    return {
      id: this.#id,
      role: this.#role,
      content: this.#content,
      metadata: this.#metadata,
      tags: this.#tags,
      created: this.#created,
      modified: this.#modified,
    };
  }
}
