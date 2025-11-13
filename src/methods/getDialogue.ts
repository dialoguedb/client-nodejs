import {
  Settings,
  SettingsContainer,
} from "@/settings/class.SettingsContainer";
import { initializeDialogue } from "@/methods/initializeDialogue";
import { get } from "@/api/dialogue";
import { useSettings } from "@/settings/useSettings";
import { GetDialogueInput } from "@/types";
/**
 * Dialogue - Get Single Dialogue
 *
 * Uses API to return dialogue given the id
 *
 * @param id
 * @param config Settings configuration
 * @returns null | Dialogue
 */
export async function getDialogue(
  input: GetDialogueInput,
  config?: SettingsContainer | Settings
) {
  const savedDialogue = await get(input, useSettings(config));
  return savedDialogue ? initializeDialogue(savedDialogue) : savedDialogue;
}
