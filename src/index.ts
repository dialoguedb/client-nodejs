// settings
import { settings } from "./settings";
import { createConfig } from "./settings/createConfig";

// dialogue class/utils
import { Dialogue } from "./dialogue/class.dialogue";
import { createDialogue } from "./methods/createDialogue";
import { getDialogue } from "./methods/getDialogue";
import { initializeDialogue } from "./methods/initializeDialogue";
import { listDialogues } from "./methods/listDialogues";
import { useDialogue } from "./methods/useDialogue";

// api things
import * as dialogueApi from "./api/dialogue";
import * as messageApi from "./api/message";
import * as messagesApi from "./api/messages";
import * as memoryApi from "./api/memory";

import * as searchApi from "./api/search";

// expose raw api
export const api = {
  search: searchApi.search,
  dialogue: {
    remove: dialogueApi.remove,
    create: dialogueApi.create,
    update: dialogueApi.update,
    list: dialogueApi.list,
    get: dialogueApi.get,
  },
  messages: {
    create: messageApi.create,
    list: messagesApi.list,
    remove: messageApi.remove,
  },
  message: {
    get: messageApi.get,
    create: messageApi.create,
    remove: messageApi.remove,
  },
  state: {
    update: dialogueApi.update,
    get: dialogueApi.get,
  },
  memory: {
    create: memoryApi.create,
    get: memoryApi.get,
    // remove: memoryApi.remove,
    // update: memoryApi.update,
    // list: memoryApi.list,
  },
};

export {
  // settings
  settings,
  createConfig,

  // expose the class
  Dialogue,
  initializeDialogue,

  // convenience functions
  useDialogue,
  createDialogue,
  listDialogues,
  getDialogue,
};
