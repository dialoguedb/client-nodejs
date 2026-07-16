import { SettingsOrContainer } from "@/settings/class.SettingsContainer";
import { get } from "@/api/dialogue";
import { useSettings } from "@/settings/useSettings";
import { GetDialogueInput, IDialogue } from "@/types";
import { Dialogue } from "@/dialogue/class.dialogue";
import { errors, isNotFoundError } from "@/errors";

/**
 * Get a dialogue by ID.
 *
 * @throws {DialogueDBError} If the dialogue cannot be resolved. A miss is
 * reported rather than returned as null: because an omitted namespace resolves
 * to the default one, a null could mean either "does not exist" or "you did not
 * pass the namespace it was created with", and silently returning the former
 * hides the latter until it surfaces as a null-pointer downstream.
 */
export async function getDialogue(
  input: GetDialogueInput,
  config?: SettingsOrContainer
): Promise<Dialogue> {
  const settings = useSettings(config);

  let data: IDialogue | null;
  try {
    data = await get(input, settings);
  } catch (error) {
    if (isNotFoundError(error)) {
      throw errors.dialogueNotFound(input.id, input.namespace, error);
    }
    throw error;
  }

  if (!data) {
    throw errors.dialogueNotFound(input.id, input.namespace);
  }

  return new Dialogue(data, settings);
}
