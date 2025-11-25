import { get } from "@/api/dialogue";
import { SettingsOrContainer } from "@/settings/class.SettingsContainer";
import { useSettings } from "@/settings/useSettings";
import { createDialogue } from "./createDialogue";
import { ulid } from "ulid";
import { UseDialogueInput, GetDialogueInput } from "@/types";
import { Dialogue } from "@/dialogue/class.dialogue";

export async function useDialogue(
  input?: UseDialogueInput,
  config?: SettingsOrContainer
) {
  const settings = useSettings(config);
  if (input?.id) {
    const res = await get(input as GetDialogueInput, settings);
    if (res && res?.id) {
      return new Dialogue(res, settings);
    } else {
      // need to make new
      return createDialogue(input, settings);
    }
  } else {
    // no id, treat as new
    return createDialogue({ id: ulid() }, settings);
  }
}
