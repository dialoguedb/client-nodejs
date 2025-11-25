import { useSettings } from "@/settings/useSettings";
import {
  Settings,
  SettingsContainer,
} from "@/settings/class.SettingsContainer";
import { Dialogue } from "./class.dialogue";
import { Memory } from "./class.memory";
import { Message } from "./class.message";
import { CreateDialogueInput, CreateMemoryInput } from "@/types";
import { createDialogue } from "@/methods/createDialogue";
import { getDialogue } from "@/methods/getDialogue";
import { createMemory } from "@/methods/createMemory";
import { getMemory } from "@/methods/getMemory";
import {
  searchDialogues,
  searchMessages,
  searchMemories,
  SearchOptions,
} from "@/methods/search";

export class DialogueDB {
  #settings: SettingsContainer;

  constructor(settings?: SettingsContainer | Settings) {
    this.#settings = useSettings(settings);
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
  getDialogue(id: string): Promise<Dialogue | null> {
    return getDialogue({ id }, this.#settings);
  }

  /**
   * Create a new memory
   */
  createMemory(input: CreateMemoryInput): Promise<Memory> {
    return createMemory(input, this.#settings);
  }

  /**
   * Get an existing memory by key
   */
  getMemory(key: string): Promise<Memory | null> {
    return getMemory({ key }, this.#settings);
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
