import { ulid } from "@/utils/ulid";
import { create } from "../api/dialogue";
import { useSettings } from "@/settings/useSettings";
import { initializeDialogue } from "./initializeDialogue";
import { SettingsOrContainer } from "@/settings/class.SettingsContainer";
import { CreateDialogueInput } from "@/types";

/**
 *
 * @param id the id of dialogue to create
 * @param config Settings configuration
 * @returns
 */
export async function createDialogue(
  input?: CreateDialogueInput,
  config?: SettingsOrContainer
) {
  const payload: CreateDialogueInput = {
    id: input?.id ? input?.id : ulid(),
  };

  if (input?.namespace) {
    payload.namespace = input.namespace;
  }
  if (input?.threadOf) {
    payload.threadOf = input.threadOf;
  }
  if (input?.messages) {
    payload.messages = input.messages;
  }
  if (input?.state) {
    payload.state = input.state;
  }
  if (input?.metadata) {
    payload.metadata = input.metadata;
  }
  if (input?.tags) {
    payload.tags = input.tags;
  }
  if (input?.expiresTimestamp) {
    payload.expiresTimestamp = input.expiresTimestamp;
  }

  const data = await create(payload, useSettings(config));
  return initializeDialogue(data);
}
