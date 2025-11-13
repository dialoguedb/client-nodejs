import { IDialogue } from "@/types";
import { defaults } from "@/utils/lodash";

export function dialogueDefaults(options: Partial<IDialogue>): IDialogue {
  const properties = {
    id: "",

    canceled: false,
    expired: false,
    expiresTimestamp: 0,

    messages: [],
    state: {},
    metadata: {},

    created: "",
    modified: "",
    tags: [],
  } as IDialogue;
  return defaults(options, { ...properties });
}
