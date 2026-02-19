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
import { listDialogues } from "@/methods/listDialogues";

export class DialogueDB {
  #settings: SettingsContainer;

  constructor(settings?: SettingsContainer | Partial<Settings>) {
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
  getDialogue(id: string, namespace?: string): Promise<Dialogue | null> {
    return getDialogue({ id, namespace }, this.#settings);
  }

  /**
   * List dialogues
   */
  listDialogues(input: Parameters<typeof listDialogues>[0] = {}) {
    return listDialogues(input, this.#settings);
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
  getMemory(id: string, namespace?: string): Promise<Memory | null> {
    return getMemory({ id, namespace }, this.#settings);
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
