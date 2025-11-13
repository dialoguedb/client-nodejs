import { IDialogue, IMessage, CreateMessageInput } from "@/types";
import { update, list } from "@/api/dialogue";
import * as messageApi from "@/api/message";
import * as messagesApi from "@/api/messages";
import { useSettings } from "@/settings/useSettings";
import {
  Settings,
  SettingsContainer,
} from "@/settings/class.SettingsContainer";
import { dialogueDefaults } from "@/methods/dialogueDefaults";
import { safeParseJson, safeStringifyJson } from "@/utils/json";
import { createDialogue } from "@/methods/createDialogue";
import { initializeDialogue } from "@/methods/initializeDialogue";

export class Dialogue {
  public id: string;
  public namespace?: string;

  public messages: IMessage[] = [];

  public state: Record<string, any>;

  public metadata: Record<string, any>;

  public created: string = new Date().toISOString();
  public modified: string;

  public tags: string[] = [];

  #nextToken?: string;
  #settings: SettingsContainer;
  #isDirty: boolean = false;

  constructor(
    dialogue: { id: string; namespace?: string } & Partial<IDialogue>,
    settings?: SettingsContainer | Settings
  ) {
    this.id = dialogue.id;
    this.namespace = dialogue.namespace;

    this.setProperties(dialogueDefaults(dialogue));
    this.#settings = useSettings(settings);
  }

  setProperties(dialogue: IDialogue) {
    this.id = dialogue.id;
    this.namespace = dialogue.namespace;

    this.messages = dialogue.messages;
    this.state = safeParseJson(dialogue.state);
    this.metadata = safeParseJson(dialogue.metadata);

    this.created = dialogue.created;
    this.modified = dialogue.modified;
    this.tags = dialogue.tags;

    return this;
  }

  setState(state: Record<string, any>) {
    this.state = safeParseJson(safeStringifyJson(state));
    this.#isDirty = true;
  }

  getState() {
    return { ...this.state };
  }
  getMetadata() {
    return { ...this.metadata };
  }

  /**
   * Add a message to the dialogue
   * POSTs immediately to API, updates local cache
   */

  async addMessage(message: CreateMessageInput) {
    const created = await messageApi.create(
      { ...message, dialogueId: this.id },
      this.#settings
    );
    this.messages.push(created as any);
    return created;
  }

  /**
   * Add multiple messages to the dialogue in a single batch operation
   * More efficient than calling addMessage multiple times
   */
  async addMessages(
    messages: Array<{
      role: string;
      content: string;
      id?: string;
      created?: string;
    }>
  ) {
    const createdMessages = await Promise.all(
      messages.map((message) =>
        messagesApi.create({ ...message, dialogueId: this.id }, this.#settings)
      )
    );
    this.messages.push(...(createdMessages as any));
    return createdMessages;
  }

  /**
   * Load messages from API into local cache
   * Replaces cache by default, or appends if using pagination
   */
  async loadMessages(options?: { limit?: number; next?: string }) {
    const { items, next } = await messagesApi.list(
      { ...(options ?? {}), dialogueId: this.id },
      this.#settings
    );

    if (options?.next) {
      // Pagination - append
      this.messages.push(...(items as any));
    } else {
      // Initial load - replace
      this.messages = items as any;
    }

    this.#nextToken = next;
    return items;
  }

  /**
   * Delete a message
   * Calls API and removes from local cache
   */
  async deleteMessage(messageId: string): Promise<void> {
    await messageApi.remove(
      { dialogueId: this.id, id: messageId },
      this.#settings
    );
    this.messages = this.messages.filter((m: any) => m.id !== messageId);
  }

  /**
   * Create a child thread of this dialogue
   */
  async createThread(input: {
    metadata?: Record<string, any>;
    tags?: string[];
  }) {
    return createDialogue(
      {
        ...input,
        threadOf: this.id,
      },
      this.#settings
    );
  }

  /**
   * Get all child threads
   */
  async getThreads() {
    const response = await list(
      {
        query: "threads",
        threadOf: this.id,
      } as any,
      this.#settings
    );

    return response.items.map((d: any) =>
      initializeDialogue(d, this.#settings)
    );
  }

  /**
   * End/close the dialogue
   */
  async end(): Promise<void> {
    // TODO: Implement when backend action endpoint is ready
    // await api.dialogues.action(this.id, 'end');
    throw new Error(
      "end() action not yet implemented - backend endpoint needed"
    );
  }

  /**
   * Compact/summarize the dialogue
   */
  async compact(): Promise<any> {
    // TODO: Implement when backend action endpoint is ready
    // return api.dialogues.action(this.id, 'compact');
    throw new Error(
      "compact() action not yet implemented - backend endpoint needed"
    );
  }

  /**
   * Check if there are unsaved changes
   */
  get isDirty(): boolean {
    return this.#isDirty;
  }

  /**
   * Check if more messages can be loaded
   */
  get hasMoreMessages(): boolean {
    return !!this.#nextToken;
  }

  async save() {
    const payload: { id: string } & Record<string, any> = {
      id: this.id,
    };

    if (this.namespace) {
      payload.namespace = this.namespace;
    }
    if (this.state && Object.keys(this.state).length) {
      payload.state = this.state;
    }
    if (this.metadata && Object.keys(this.metadata).length) {
      payload.metadata = this.metadata;
    }

    // Only call API if there are changes beyond just the id
    if (Object.keys(payload).length === 1) {
      return this; // Nothing to save
    }

    const req = await update(payload, this.#settings);

    // Clear dirty flag after successful save
    this.#isDirty = false;

    return this.setProperties(req);
  }
}
