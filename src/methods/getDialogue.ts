import { SettingsOrContainer } from "@/settings/class.SettingsContainer";
import { get } from "@/api/dialogue";
import { useSettings } from "@/settings/useSettings";
import { GetDialogueInput } from "@/types";
import { Dialogue } from "@/dialogue/class.dialogue";
import { DialogueDBError } from "@/utils/request";

/**
 * Get a dialogue by ID. Returns null if the dialogue does not exist.
 */
export async function getDialogue(
  input: GetDialogueInput,
  config?: SettingsOrContainer
): Promise<Dialogue | null> {
  const settings = useSettings(config);
  try {
    const data = await get(input, settings);
    return data ? new Dialogue(data, settings) : null;
  } catch (error) {
    if (error instanceof DialogueDBError && error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}
