import {
  IDialogue,
  IMessage,
  CreateMessageInput,
  ListMessageFilters,
} from "@/types";
import * as dialogueApi from "@/api/dialogue";
import * as messageApi from "@/api/message";
import * as messagesApi from "@/api/messages";
import { useSettings } from "@/settings/useSettings";
import {
  Settings,
  SettingsContainer,
} from "@/settings/class.SettingsContainer";
import { safeParseJson, safeStringifyJson } from "@/utils/json";
import { Message } from "./class.message";
import { isPlainObject } from "@/utils/lodash";

export class Dialogue {
  #id: string;
  #namespace?: string;
  #metadata: Record<string, any> = {};
  #created: string;
  #modified: string;

  #messages: Message[] = [];
  #state: Record<string, any> = {};
  #tags: string[] = [];

  #settings: SettingsContainer;
  #isDirty: boolean = false;
  #stateChanged: boolean = false;
  #tagsChanged: boolean = false;
  #nextToken?: string;

  constructor(dialogue: IDialogue, settings?: SettingsContainer | Settings) {
    this.#settings = useSettings(settings);
    this.#setProperties(dialogue);
  }

  #setProperties(dialogue: IDialogue): void {
    // Required
    if (!dialogue?.id || typeof dialogue.id !== "string") {
      throw new Error("Dialogue id is required and must be a string");
    }

    this.#id = dialogue.id;

    // Optional namespace
    if (typeof dialogue.namespace === "string") {
      this.#namespace = dialogue.namespace;
    }

    // Timestamps - default to now if missing
    const now = new Date().toISOString();
    this.#created =
      typeof dialogue.created === "string" ? dialogue.created : now;
    this.#modified =
      typeof dialogue.modified === "string" ? dialogue.modified : this.#created;

    // deep clone to prevent external mutation!
    if (isPlainObject(dialogue.metadata)) {
      this.#metadata = structuredClone(dialogue.metadata);
    }

    // deep clone to prevent external mutation!
    if (isPlainObject(dialogue.state)) {
      this.#state = structuredClone(dialogue.state);
    }

    if (Array.isArray(dialogue.tags)) {
      if (dialogue.tags.every((a) => typeof a === "string")) {
        this.#tags = [...dialogue.tags];
      } else {
        throw new Error("tags must be array of strings");
      }
    }

    this.#messages = Array.isArray(dialogue.messages)
      ? dialogue.messages.map((m) => this.#createMessage(m))
      : [];
  }

  #createMessage(message: IMessage): Message {
    const msg = new Message(this.#id, message, this.#settings, {
      onRemoved: () => {
        this.#messages = this.#messages.filter((m) => m.id !== msg.id);
      },
    });
    return msg;
  }

  // ============ Readonly Getters ============

  get id(): string {
    return this.#id;
  }

  get namespace(): string | undefined {
    return this.#namespace;
  }

  get metadata(): Readonly<Record<string, any>> {
    return { ...this.#metadata };
  }

  get created(): string {
    return this.#created;
  }

  get modified(): string {
    return this.#modified;
  }

  get messages(): readonly Message[] {
    return [...this.#messages];
  }

  // ============ Mutable Getters/Setters ============

  get state(): Record<string, any> {
    return structuredClone(this.#state);
  }

  set state(value: Record<string, any>) {
    this.#state = safeParseJson(safeStringifyJson(value));
    this.#isDirty = true;
    this.#stateChanged = true;
  }

  get tags(): string[] {
    return [...this.#tags];
  }

  set tags(value: string[]) {
    if (!Array.isArray(value)) {
      throw new Error("tags must be an array");
    }
    if (!value.every((t) => typeof t === "string")) {
      throw new Error("tags must be array of strings");
    }
    this.#tags = [...value];
    this.#isDirty = true;
    this.#tagsChanged = true;
  }

  /**
   * Set state and save immediately
   */
  async saveState(state: Record<string, any>): Promise<Dialogue> {
    this.state = state;
    return this.save();
  }

  /**
   * Set tags and save immediately
   */
  async saveTags(tags: string[]): Promise<Dialogue> {
    this.tags = tags;
    return this.save();
  }

  /**
   * Create and save a message to the dialogue
   */
  async saveMessage(
    message: Omit<CreateMessageInput, "dialogueId">
  ): Promise<Message> {
    const created = await messageApi.create(
      { ...message, dialogueId: this.#id },
      this.#settings
    );

    const newMessage = this.#createMessage(created);
    this.#messages.push(newMessage);

    return newMessage;
  }

  /**
   * Create and save multiple messages to the dialogue
   */
  async saveMessages(
    messages: Array<{
      role: string;
      content: string;
      id?: string;
      created?: string;
    }>
  ): Promise<Message[]> {
    const createdMessages = await messagesApi.create(
      {
        id: this.#id,
        messages: messages.map((message) => ({
          ...message,
        })),
      },
      this.#settings
    );

    const newMessages = createdMessages.map((created) =>
      this.#createMessage(created)
    );
    this.#messages.push(...newMessages);
    return newMessages;
  }

  /**
   * Load messages from API into local cache
   * Replaces cache by default, or appends if using pagination (next: true)
   */
  async loadMessages(
    options?: Omit<ListMessageFilters, "dialogueId" | "next"> & {
      next?: boolean;
    }
  ) {
    const { next: shouldLoadNext, ...restOfOptions } = options || {};

    // If requesting next page but no token exists, treat as fresh load
    const isAppending = shouldLoadNext && !!this.#nextToken;

    const payload: ListMessageFilters = {
      ...(restOfOptions ?? {}),
      dialogueId: this.#id,
    };

    if (isAppending) {
      payload.next = this.#nextToken;
    }

    const { items, next } = await messagesApi.list(payload, this.#settings);

    const loadedMessages = items.map((item) => this.#createMessage(item));

    if (isAppending) {
      // Pagination - append
      this.#messages.push(...loadedMessages);
    } else {
      // Initial load - replace
      this.#messages = loadedMessages;
    }

    this.#nextToken = next;
    return loadedMessages;
  }

  /**
   * Delete a message
   * Calls API and removes from local cache
   */
  async deleteMessage(messageId: string): Promise<void> {
    await messageApi.remove(
      { dialogueId: this.#id, id: messageId },
      this.#settings
    );
    this.#messages = this.#messages.filter((m) => m.id !== messageId);
  }

  /**
   * Create a child thread of this dialogue
   */
  async createThread(
    input: {
      metadata?: Record<string, any>;
      tags?: string[];
    } = {}
  ): Promise<Dialogue> {
    const data = await dialogueApi.create(
      { ...input, threadOf: this.#id },
      this.#settings
    );
    return new Dialogue(data, this.#settings);
  }

  /**
   * Get all child threads
   */
  async getThreads(): Promise<Dialogue[]> {
    const response = await dialogueApi.list(
      {
        query: "threads",
        threadOf: this.#id,
      } as any,
      this.#settings
    );

    return response.items.map((d: any) => new Dialogue(d, this.#settings));
  }

  /**
   * End/close the dialogue
   */
  async end(): Promise<void> {
    // TODO: Implement when backend action endpoint is ready
    throw new Error(
      "end() action not yet implemented - backend endpoint needed"
    );
  }

  /**
   * Compact/summarize the dialogue
   */
  async compact(): Promise<any> {
    // TODO: Implement when backend action endpoint is ready
    throw new Error(
      "compact() action not yet implemented - backend endpoint needed"
    );
  }

  /**
   * Check if there are unsaved changes (dialogue or any messages)
   */
  get isDirty(): boolean {
    return this.#isDirty || this.#messages.some((m) => m.isDirty);
  }

  /**
   * Check if more messages can be loaded
   */
  get hasMoreMessages(): boolean {
    return !!this.#nextToken;
  }

  async save(): Promise<Dialogue> {
    // Save any dirty messages
    const dirtyMessages = this.#messages.filter((m) => m.isDirty);
    if (dirtyMessages.length > 0) {
      await Promise.all(dirtyMessages.map((m) => m.save()));
    }

    // Only save dialogue if it has changes
    if (!this.#isDirty) {
      return this;
    }

    const payload: { id: string } & Record<string, any> = {
      id: this.#id,
    };

    if (this.#stateChanged) {
      payload.state = this.#state;
    }
    if (this.#tagsChanged) {
      payload.tags = this.#tags;
    }

    const updated = await dialogueApi.update(payload, this.#settings);

    this.#isDirty = false;
    this.#stateChanged = false;
    this.#tagsChanged = false;
    this.#modified = updated.modified;
    this.#state = updated.state ?? {};
    this.#tags = updated.tags ?? [];

    return this;
  }

  toJSON() {
    return {
      id: this.#id,
      namespace: this.#namespace,
      metadata: this.#metadata,
      state: this.#state,
      tags: this.#tags,
      messages: this.#messages,
      created: this.#created,
      modified: this.#modified,
    };
  }
}
