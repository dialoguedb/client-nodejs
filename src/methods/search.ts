import { search, SearchOptions } from "@/api/search";
import { useSettings } from "@/settings/useSettings";
import { SettingsOrContainer } from "@/settings/class.SettingsContainer";
import { IDialogue, IMessage, IMemory } from "@/types";
import { Dialogue } from "@/dialogue/class.dialogue";
import { Message } from "@/dialogue/class.message";
import { Memory } from "@/dialogue/class.memory";

export { SearchOptions };

// TODO: fail faster on bad syntax

/**
 * Search dialogues
 */
export async function searchDialogues(
  query: string,
  options: SearchOptions = {},
  config?: SettingsOrContainer
): Promise<Dialogue[]> {
  const result = await search<IDialogue>(
    { query, object: "dialogue", ...options },
    useSettings(config)
  );
  return result.items.map((d) => new Dialogue(d, config));
}

/**
 * Search messages
 */
export async function searchMessages(
  query: string,
  options: SearchOptions = {},
  config?: SettingsOrContainer
): Promise<Message[]> {
  const result = await search<IMessage & { dialogueId: string }>(
    { query, object: "message", ...options },
    useSettings(config)
  );
  return result.items.map((m) => new Message(m.dialogueId, m, config));
}

/**
 * Search memories
 */
export async function searchMemories(
  query: string,
  options: SearchOptions = {},
  config?: SettingsOrContainer
): Promise<Memory[]> {
  const result = await search<IMemory>(
    { query, object: "memory", ...options },
    useSettings(config)
  );
  return result.items.map((m) => new Memory(m, config));
}
