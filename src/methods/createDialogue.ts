import { create } from "../api/dialogue";
import { useSettings } from "@/settings/useSettings";
import { SettingsOrContainer } from "@/settings/class.SettingsContainer";
import { CreateDialogueInput } from "@/types";
import { Dialogue } from "@/dialogue/class.dialogue";

/**
 * Create a new dialogue
 */
export async function createDialogue(
  input: CreateDialogueInput = {},
  config?: SettingsOrContainer
): Promise<Dialogue> {
  const data = await create(input, useSettings(config));
  return new Dialogue(data, config);
}
