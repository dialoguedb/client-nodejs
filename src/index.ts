// settings
import { settings, setGlobalConfig } from "./settings";
import { createConfig } from "./settings/createConfig";

// errors
export { DialogueDBError } from "./errors";
export type { ErrorType } from "./utils/request";

// classes
import { DialogueDB } from "./dialogue/class.dialogue-db";
import { Dialogue } from "./dialogue/class.dialogue";
import { Message } from "./dialogue/class.message";
import { Memory } from "./dialogue/class.memory";

// types
export type {
  IDialogue,
  CreateDialogueInput,
  UpdateDialogueInput,
  GetDialogueInput,
  ListDialogueFilters,
} from "./types/dialogue";

export type {
  IMessage,
  MessageContent,
  ContentPart,
  TextPart,
  ImagePart,
  AnthropicImagePart,
  AnthropicImageSource,
  AnthropicBase64ImageSource,
  AnthropicUrlImageSource,
  OpenAIImagePart,
  ImageMediaType,
  CreateMessageInput,
  ListMessageFilters,
} from "./types/message";

export type {
  IMemory,
  CreateMemoryInput,
  ListMemoriesFilters,
} from "./types/memory";

export type { ListResponse } from "./types/utils";

export type {
  SearchObject,
  SearchOrder,
  SearchOrderBy,
  SearchTagOperators,
  SearchTagsValue,
  SearchMetadataScalar,
  SearchMetadataScalarArray,
  SearchMetadataOperators,
  SearchMetadataValue,
  SearchDateRangeOperators,
  SearchDateFilterValue,
  SearchFilterOptions,
  SearchOptions,
  SearchInput,
  SearchMatchEnvelope,
  SearchResultEnvelope,
  SearchRequestEcho,
  SearchResponse,
} from "./api/search";

export type { Settings } from "./settings/class.SettingsContainer";

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
    update: messageApi.update,
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
  setGlobalConfig,

  // classes
  DialogueDB,
  Dialogue,
  Message,
  Memory,
};
