import { ulid } from "ulid";
import { Dialogue } from "@/dialogue/class.dialogue";
import { SettingsOrContainer } from "@/settings/class.SettingsContainer";
import { IDialogue } from "@/types";
import { isNull } from "@/utils/lodash";

export function initializeDialogue(
  dialogue?: string | number | Partial<IDialogue>,
  config?: SettingsOrContainer
) {
  if (typeof dialogue === "string") {
    const id = dialogue ? dialogue : ulid();
    return new Dialogue({ id }, config);
  }

  if (typeof dialogue === "number") {
    const id = dialogue >= 0 ? `${dialogue}` : ulid();
    return new Dialogue({ id }, config);
  }

  if (typeof dialogue === "object" && !isNull(dialogue)) {
    const { id = ulid(), namespace, ...rest } = dialogue;
    return new Dialogue({ id, namespace, ...rest }, config);
  }

  return new Dialogue({ id: ulid() }, config);
}
