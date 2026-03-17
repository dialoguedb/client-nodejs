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
} from "@/methods/search";
import { listDialogues } from "@/methods/listDialogues";
import * as dialogueApi from "@/api/dialogue";
import * as memoryApi from "@/api/memory";

export class DialogueDB {
  #settings: SettingsContainer;

  constructor(settings?: SettingsContainer | Partial<Settings>) {
    this.#settings = useSettings(settings);
    if (settings && typeof settings === "object" && "apiKey" in settings) {
      const apiKey = (settings as Partial<Settings>).apiKey;
      if (typeof apiKey === "string" && apiKey.trim() === "") {
        throw new Error(
          "API key cannot be empty. Pass a valid key or set DIALOGUE_DB_API_KEY environment variable."
        );
      }
    }
  }

  /**
   * Create a new dialogue
   */
  createDialogue(input: CreateDialogueInput = {}): Promise<Dialogue> {
    return createDialogue(input, this.#settings);
  }

  /**
   * Get an existing dialogue by ID
   */
  getDialogue(
    id: string,
    options?: { namespace?: string }
  ): Promise<Dialogue | null> {
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
   * Search dialogues
   */
  searchDialogues(
    query: string,
    options: SearchOptions = {}
  ): Promise<Dialogue[]> {
    return searchDialogues(query, options, this.#settings);
  }

  /**
   * Search messages
   */
  searchMessages(
    query: string,
    options: SearchOptions = {}
  ): Promise<Message[]> {
    return searchMessages(query, options, this.#settings);
  }

  /**
   * Search memories
   */
  searchMemories(
    query: string,
    options: SearchOptions = {}
  ): Promise<Memory[]> {
    return searchMemories(query, options, this.#settings);
  }
}
