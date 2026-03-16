import { get } from "@/api/dialogue";
import { SettingsOrContainer } from "@/settings/class.SettingsContainer";
import { useSettings } from "@/settings/useSettings";
import { createDialogue } from "./createDialogue";
import { UseDialogueInput, GetDialogueInput } from "@/types";
import { Dialogue } from "@/dialogue/class.dialogue";

/**
 * Gets an existing dialogue by ID, or creates a new one.
 * If an ID is provided and the dialogue exists, returns it.
 * If an ID is provided but the dialogue doesn't exist, creates it with that ID.
 * If no ID is provided, creates a new dialogue with a generated ID.
 */
export async function getOrCreateDialogue(
  input?: UseDialogueInput,
  config?: SettingsOrContainer
) {
  const settings = useSettings(config);
  if (input?.id) {
    try {
      const res = await get(input as GetDialogueInput, settings);
      if (res && res.id) {
        return new Dialogue(res, settings);
      }
    } catch {
      // Dialogue not found — fall through to create
    }
  }
  return createDialogue(input || ({} as UseDialogueInput), settings);
}
