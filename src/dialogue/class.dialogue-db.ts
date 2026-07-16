import { useSettings } from "@/settings/useSettings";
import {
  Settings,
  SettingsContainer,
} from "@/settings/class.SettingsContainer";
import { Dialogue } from "./class.dialogue";
import { Memory } from "./class.memory";
import { Message } from "./class.message";
import {
  CreateDialogueInput,
  CreateMemoryInput,
  ListMemoriesFilters,
} from "@/types";
import { createDialogue } from "@/methods/createDialogue";
import { getDialogue } from "@/methods/getDialogue";
import { getOrCreateDialogue } from "@/methods/getOrCreateDialogue";
import { createMemory } from "@/methods/createMemory";
import { getMemory } from "@/methods/getMemory";
import {
  searchDialogues,
  searchMessages,
  searchMemories,
  SearchOptions,
  SearchResponse,
} from "@/methods/search";
import { listDialogues } from "@/methods/listDialogues";
import * as dialogueApi from "@/api/dialogue";
import * as memoryApi from "@/api/memory";

export class DialogueDB {
  #settings: SettingsContainer;

  constructor(settings?: SettingsContainer | Partial<Settings>) {
    this.#settings = useSettings(settings);
    this.#settings.assertApiKey();
  }

  /**
   * Create a new dialogue
   */
  createDialogue(input: CreateDialogueInput = {}): Promise<Dialogue> {
    return createDialogue(input, this.#settings);
  }

  /**
   * Get an existing dialogue by ID.
   *
   * Pass the namespace the dialogue was created with — without it the lookup is
   * scoped to the default namespace and will not find it.
   *
   * @throws {DialogueDBError} If the dialogue cannot be resolved.
   */
  getDialogue(id: string, options?: { namespace?: string }): Promise<Dialogue> {
    return getDialogue(
      {
        id,
        ...(options?.namespace !== undefined && {
          namespace: options.namespace,
        }),
      },
      this.#settings
    );
  }

  /**
   * Get an existing dialogue by ID, or create a new one
   */
  getOrCreateDialogue(input?: {
    id?: string;
    namespace?: string;
    threadOf?: string;
  }): Promise<Dialogue> {
    return getOrCreateDialogue(input, this.#settings);
  }

  /**
   * List dialogues
   */
  listDialogues(input: Parameters<typeof listDialogues>[0] = {}) {
    return listDialogues(input, this.#settings);
  }

  /**
   * Delete a dialogue by ID
   */
  async deleteDialogue(
    id: string,
    options?: { namespace?: string }
  ): Promise<void> {
    return dialogueApi.remove(
      {
        id,
        ...(options?.namespace !== undefined && {
          namespace: options.namespace,
        }),
      },
      this.#settings
    );
  }

  /**
   * Create a new memory
   */
  createMemory(input: CreateMemoryInput): Promise<Memory> {
    return createMemory(input, this.#settings);
  }

  /**
   * Get an existing memory by id
   */
  getMemory(
    id: string,
    options?: { namespace?: string }
  ): Promise<Memory | null> {
    return getMemory(
      {
        id,
        ...(options?.namespace !== undefined && {
          namespace: options.namespace,
        }),
      },
      this.#settings
    );
  }

  /**
   * List memories
   */
  listMemories(input: ListMemoriesFilters = {}) {
    return memoryApi.list(input, this.#settings);
  }

  /**
   * Delete a memory by id
   */
  async deleteMemory(
    id: string,
    options?: { namespace?: string }
  ): Promise<void> {
    return memoryApi.remove(
      {
        id,
        ...(options?.namespace !== undefined && {
          namespace: options.namespace,
        }),
      },
      this.#settings
    );
  }

  /**
   * Search dialogues. Returns the wrapper response with hydrated Dialogue
   * instances in `results[].item` plus `relevance`, optional `matches`, and
   * the server's `request` echo. Flatten with `response.results.map((r) => r.item)`
   * if only domain objects are needed.
   */
  searchDialogues(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResponse<Dialogue, Message>> {
    return searchDialogues(query, options, this.#settings);
  }

  /**
   * Search messages. Returns the wrapper response with hydrated Message
   * instances in `results[].item`.
   */
  searchMessages(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResponse<Message, Message>> {
    return searchMessages(query, options, this.#settings);
  }

  /**
   * Search memories. Returns the wrapper response with hydrated Memory
   * instances in `results[].item`.
   */
  searchMemories(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResponse<Memory, Message>> {
    return searchMemories(query, options, this.#settings);
  }
}
