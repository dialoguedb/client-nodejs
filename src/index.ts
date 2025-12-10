// settings
import { settings } from "./settings";
import { createConfig } from "./settings/createConfig";

// errors
export { DialogueDBError } from "./errors";
export type { ErrorType } from "./utils/request";

// dialogue class/utils
import { DialogueDB } from "./dialogue/class.dialogue-db";

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
    create: messagesApi.create,
    list: messagesApi.list,
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
    remove: memoryApi.remove,
    update: memoryApi.update,
    list: memoryApi.list,
  },
};

export {
  // settings
  settings,
  createConfig,

  // expose the class
  DialogueDB,
};
