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
import { Message } from "./class.message";
import { isPlainObject } from "@/utils/lodash";
import { inspect } from "util";
import { errors } from "@/errors";

export class Dialogue {
  #id: string;
  #projectId: string;
  #requestId: string;
  #status: "active" | "ended" | "archived";
  #created: string;
  #modified: string;

  // Optional fields
  #namespace?: string;
  #threadOf?: string;
  #label?: string;
  #archivedAt?: string;
  #endedAt?: string;
  #totalMessages?: number;
  #threadCount?: number;
  #lastMessageCreated?: string;

  #metadata: Record<string, any> = {};
  #messages: Message[] = [];
  #state: Record<string, any> = {};
  #tags: string[] = [];

  #settings: SettingsContainer;
  #isDirty: boolean = false;
  #stateChanged: boolean = false;
  #tagsChanged: boolean = false;
  #labelChanged: boolean = false;
  #nextToken?: string;

  constructor(
    dialogue: IDialogue,
    settings?: SettingsContainer | Partial<Settings>
  ) {
    this.#settings = useSettings(settings);
    this.#setProperties(dialogue);
  }

  #setProperties(dialogue: IDialogue): void {
    // Required fields
    if (!dialogue?.id || typeof dialogue.id !== "string") {
      throw errors.invalidParameter("id", "is required and must be a string");
    }
    this.#id = dialogue.id;
    this.#projectId = dialogue.projectId;
    this.#requestId = dialogue.requestId;
    this.#status = dialogue.status;

    // Timestamps
    const now = new Date().toISOString();
    this.#created =
      typeof dialogue.created === "string" ? dialogue.created : now;
    this.#modified =
      typeof dialogue.modified === "string" ? dialogue.modified : this.#created;

    // Optional string fields
    if (typeof dialogue.namespace === "string") {
      this.#namespace = dialogue.namespace;
    }
    if (typeof dialogue.threadOf === "string") {
      this.#threadOf = dialogue.threadOf;
    }
    if (typeof dialogue.label === "string") {
      this.#label = dialogue.label;
    }
    if (typeof dialogue.archivedAt === "string") {
      this.#archivedAt = dialogue.archivedAt;
    }
    if (typeof dialogue.endedAt === "string") {
      this.#endedAt = dialogue.endedAt;
    }
    if (typeof dialogue.lastMessageCreated === "string") {
      this.#lastMessageCreated = dialogue.lastMessageCreated;
    }

    // Optional number fields
    if (typeof dialogue.totalMessages === "number") {
      this.#totalMessages = dialogue.totalMessages;
    }
    if (typeof dialogue.threadCount === "number") {
      this.#threadCount = dialogue.threadCount;
    }

    // Deep clone objects to prevent external mutation
    if (dialogue.metadata && isPlainObject(dialogue.metadata)) {
      this.#metadata = structuredClone(dialogue.metadata);
    }
    if (dialogue.state && isPlainObject(dialogue.state)) {
      this.#state = structuredClone(dialogue.state);
    }

    if (Array.isArray(dialogue.tags)) {
      if (dialogue.tags.every((a) => typeof a === "string")) {
        this.#tags = [...dialogue.tags];
      } else {
        throw errors.invalidParameter("tags", "must be array of strings");
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

  get id(): string {
    return this.#id;
  }

  get projectId(): string {
    return this.#projectId;
  }

  get requestId(): string {
    return this.#requestId;
  }

  get status(): "active" | "ended" | "archived" {
    return this.#status;
  }

  get namespace(): string | undefined {
    return this.#namespace;
  }

  get threadOf(): string | undefined {
    return this.#threadOf;
  }

  get archivedAt(): string | undefined {
    return this.#archivedAt;
  }

  get endedAt(): string | undefined {
    return this.#endedAt;
  }

  get totalMessages(): number | undefined {
    return this.#totalMessages;
  }

  get threadCount(): number | undefined {
    return this.#threadCount;
  }

  get lastMessageCreated(): string | undefined {
    return this.#lastMessageCreated;
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

  /**
   * Mutable Getters/Setters
   */

  get label(): string | undefined {
    return this.#label;
  }

  set label(value: string | undefined) {
    this.#label = value;
    this.#isDirty = true;
    this.#labelChanged = true;
  }

  get state(): Record<string, any> {
    return structuredClone(this.#state);
  }

  set state(value: Record<string, any>) {
    this.#state = structuredClone(value);
    this.#isDirty = true;
    this.#stateChanged = true;
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
        threadOf: this.#id,
      },
      this.#settings
    );

    return response.items.map((d) => new Dialogue(d, this.#settings));
  }

  /**
   * End/close the dialogue
   */
  async end(): Promise<void> {
    // TODO: Implement when backend action endpoint is ready
    throw errors.notImplemented("end");
  }

  /**
   * Compact/summarize the dialogue
   */
  async compact(): Promise<any> {
    // TODO: Implement when backend action endpoint is ready
    throw errors.notImplemented("compact");
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
    if (this.#labelChanged) {
      payload.label = this.#label;
    }

    const updated = await dialogueApi.update(payload, this.#settings);

    this.#isDirty = false;
    this.#stateChanged = false;
    this.#tagsChanged = false;
    this.#labelChanged = false;
    this.#modified = updated.modified;
    this.#state = updated.state ?? {};
    this.#tags = updated.tags ?? [];
    if (typeof updated.label === "string") {
      this.#label = updated.label;
    }

    return this;
  }

  toJSON() {
    return {
      id: this.#id,
      projectId: this.#projectId,
      requestId: this.#requestId,
      status: this.#status,
      ...(this.#namespace !== undefined && { namespace: this.#namespace }),
      ...(this.#threadOf !== undefined && { threadOf: this.#threadOf }),
      ...(this.#label !== undefined && { label: this.#label }),
      ...(this.#archivedAt !== undefined && { archivedAt: this.#archivedAt }),
      ...(this.#endedAt !== undefined && { endedAt: this.#endedAt }),
      ...(this.#totalMessages !== undefined && {
        totalMessages: this.#totalMessages,
      }),
      ...(this.#threadCount !== undefined && {
        threadCount: this.#threadCount,
      }),
      ...(this.#lastMessageCreated !== undefined && {
        lastMessageCreated: this.#lastMessageCreated,
      }),
      metadata: this.#metadata,
      state: this.#state,
      tags: this.#tags,
      messages: this.#messages,
      created: this.#created,
      modified: this.#modified,
    };
  }

  [inspect.custom]() {
    return this.toJSON();
  }
}
