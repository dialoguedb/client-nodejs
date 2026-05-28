import {
  search,
  SearchOptions,
  SearchResponse,
  SearchResultEnvelope,
  SearchMatchEnvelope,
  SearchRequestEcho,
} from "@/api/search";
import { useSettings } from "@/settings/useSettings";
import { SettingsOrContainer } from "@/settings/class.SettingsContainer";
import { IDialogue, IMessage, IMemory } from "@/types";
import { Dialogue } from "@/dialogue/class.dialogue";
import { Message } from "@/dialogue/class.message";
import { Memory } from "@/dialogue/class.memory";

export {
  SearchOptions,
  SearchResponse,
  SearchResultEnvelope,
  SearchMatchEnvelope,
  SearchRequestEcho,
};

function hydrateMatches(
  matches: SearchMatchEnvelope<IMessage>[] | undefined,
  settings: ReturnType<typeof useSettings>
): SearchMatchEnvelope<Message>[] | undefined {
  if (!matches) return undefined;
  return matches.map((m) => ({
    object: m.object,
    relevance: m.relevance,
    item: new Message(m.item.dialogueId, m.item, settings),
  }));
}

/**
 * Search dialogues. Returns the response wrapper with hydrated Dialogue
 * instances in `results[].item`, preserving `relevance`, `matches`, and the
 * server's request echo.
 */
export async function searchDialogues(
  query: string,
  options: SearchOptions = {},
  config?: SettingsOrContainer
): Promise<SearchResponse<Dialogue, Message>> {
  const settings = useSettings(config);
  const raw = await search<IDialogue, IMessage>(
    { query, object: "dialogue", ...options },
    settings
  );
  return {
    request: raw.request,
    results: raw.results.map((r) => ({
      object: r.object,
      relevance: r.relevance,
      item: new Dialogue(r.item, settings),
      matches: hydrateMatches(r.matches, settings),
    })),
  };
}

/**
 * Search messages. Returns the response wrapper with hydrated Message
 * instances in `results[].item`.
 */
export async function searchMessages(
  query: string,
  options: SearchOptions = {},
  config?: SettingsOrContainer
): Promise<SearchResponse<Message, Message>> {
  const settings = useSettings(config);
  const raw = await search<IMessage, IMessage>(
    { query, object: "message", ...options },
    settings
  );
  return {
    request: raw.request,
    results: raw.results.map((r) => ({
      object: r.object,
      relevance: r.relevance,
      item: new Message(r.item.dialogueId, r.item, settings),
      matches: hydrateMatches(r.matches, settings),
    })),
  };
}

/**
 * Search memories. Returns the response wrapper with hydrated Memory
 * instances in `results[].item`.
 */
export async function searchMemories(
  query: string,
  options: SearchOptions = {},
  config?: SettingsOrContainer
): Promise<SearchResponse<Memory, Message>> {
  const settings = useSettings(config);
  const raw = await search<IMemory, IMessage>(
    { query, object: "memory", ...options },
    settings
  );
  return {
    request: raw.request,
    results: raw.results.map((r) => ({
      object: r.object,
      relevance: r.relevance,
      item: new Memory(r.item, settings),
      matches: hydrateMatches(r.matches, settings),
    })),
  };
}
