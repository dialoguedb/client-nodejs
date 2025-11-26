import { SettingsOrContainer } from "@/settings/class.SettingsContainer";
import { get } from "@/api/dialogue";
import { useSettings } from "@/settings/useSettings";
import { GetDialogueInput } from "@/types";
import { Dialogue } from "@/dialogue/class.dialogue";

/**
 * Get a dialogue by ID
 */
export async function getDialogue(
  input: GetDialogueInput,
  config?: SettingsOrContainer
): Promise<Dialogue | null> {
  const settings = useSettings(config);
  const data = await get(input, settings);
  return data ? new Dialogue(data, settings) : null;
}
