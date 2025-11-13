import { initializeDialogue } from "@/methods/initializeDialogue";
import { get } from "@/api/dialogue";
import { SettingsOrContainer } from "@/settings/class.SettingsContainer";
import { useSettings } from "@/settings/useSettings";
import { createDialogue } from "./createDialogue";
import { ulid } from "ulid";
import { UseDialogueInput, GetDialogueInput } from "@/types";

export async function useDialogue(
  input?: UseDialogueInput,
  config?: SettingsOrContainer
) {
  if (input?.id) {
    const res = await get(input as GetDialogueInput, useSettings(config));
    if (res && res?.id) {
      return initializeDialogue(res);
    } else {
      // need to make new
      return createDialogue(input, useSettings(config));
    }
  } else {
    // no id, treat as new
    return createDialogue({ id: ulid() }, useSettings(config));
  }
}
