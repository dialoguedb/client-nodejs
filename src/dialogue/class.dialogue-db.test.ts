import { DialogueDB } from "./class.dialogue-db";
import { Dialogue } from "./class.dialogue";
import { Memory } from "./class.memory";
import { Message } from "./class.message";
import { createDialogue } from "@/methods/createDialogue";
import { getDialogue } from "@/methods/getDialogue";
import { getOrCreateDialogue } from "@/methods/getOrCreateDialogue";
import { createMemory } from "@/methods/createMemory";
import { getMemory } from "@/methods/getMemory";
import {
  searchDialogues,
  searchMessages,
  searchMemories,
} from "@/methods/search";
import { listDialogues } from "@/methods/listDialogues";
import * as dialogueApi from "@/api/dialogue";
import * as memoryApi from "@/api/memory";
import { SettingsContainer } from "@/settings/class.SettingsContainer";

jest.mock("@/methods/createDialogue");
jest.mock("@/methods/getDialogue");
jest.mock("@/methods/getOrCreateDialogue");
jest.mock("@/methods/createMemory");
jest.mock("@/methods/getMemory");
jest.mock("@/methods/search");
jest.mock("@/methods/listDialogues");
jest.mock("@/api/dialogue", () => ({
  remove: jest.fn(),
}));
jest.mock("@/api/memory", () => ({
  list: jest.fn(),
  remove: jest.fn(),
}));

describe("DialogueDB", () => {
  const createDialogueMock = createDialogue as jest.Mock;
  const getDialogueMock = getDialogue as jest.Mock;
  const getOrCreateDialogueMock = getOrCreateDialogue as jest.Mock;
  const createMemoryMock = createMemory as jest.Mock;
  const getMemoryMock = getMemory as jest.Mock;
  const searchDialoguesMock = searchDialogues as jest.Mock;
  const searchMessagesMock = searchMessages as jest.Mock;
  const searchMemoriesMock = searchMemories as jest.Mock;
  const dialogueRemoveMock = dialogueApi.remove as jest.Mock;
  const memoryListMock = memoryApi.list as jest.Mock;
  const memoryRemoveMock = memoryApi.remove as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should throw when no API key is available", () => {
      expect(() => new DialogueDB()).toThrow("API key is required");
    });

    it("should throw when API key is empty string", () => {
      expect(() => new DialogueDB({ apiKey: "" })).toThrow("API key is required");
    });

    it("should throw when API key is whitespace", () => {
      expect(() => new DialogueDB({ apiKey: "   " })).toThrow("API key is required");
    });

    it("should create instance with settings object", () => {
      const db = new DialogueDB({
        apiKey: "test-key",
        endpoint: "https://api.example.com",
      });
      expect(db).toBeInstanceOf(DialogueDB);
    });

    it("should create instance with SettingsContainer", () => {
      const settings = new SettingsContainer();
      settings.set("apiKey", "test-key");
      const db = new DialogueDB(settings);
      expect(db).toBeInstanceOf(DialogueDB);
    });
  });

  describe("createDialogue", () => {
    it("should create dialogue with default empty input", async () => {
      const mockDialogue = { id: "test-id" } as unknown as Dialogue;
      createDialogueMock.mockResolvedValueOnce(mockDialogue);

      const db = new DialogueDB({ apiKey: "test-key" });
      const result = await db.createDialogue();

      expect(createDialogueMock).toHaveBeenCalledTimes(1);
      expect(createDialogueMock).toHaveBeenCalledWith(
        {},
        expect.any(SettingsContainer)
      );
      expect(result).toBe(mockDialogue);
    });

    it("should create dialogue with provided input", async () => {
      const mockDialogue = {
        id: "generated-id",
        namespace: "ns",
      } as unknown as Dialogue;
      createDialogueMock.mockResolvedValueOnce(mockDialogue);

      const db = new DialogueDB({ apiKey: "test-key" });
      const result = await db.createDialogue({
        namespace: "ns",
        metadata: { key: "value" },
      });

      expect(createDialogueMock).toHaveBeenCalledWith(
        { namespace: "ns", metadata: { key: "value" } },
        expect.any(SettingsContainer)
      );
      expect(result).toBe(mockDialogue);
    });

    it("should pass settings to createDialogue", async () => {
      const settings = new SettingsContainer();
      settings.set("apiKey", "my-key");
      const mockDialogue = { id: "test" } as unknown as Dialogue;
      createDialogueMock.mockResolvedValueOnce(mockDialogue);

      const db = new DialogueDB(settings);
      await db.createDialogue();

      expect(createDialogueMock).toHaveBeenCalledWith({}, settings);
    });
  });

  describe("getDialogue", () => {
    it("should get dialogue by id", async () => {
      const mockDialogue = { id: "found-id" } as unknown as Dialogue;
      getDialogueMock.mockResolvedValueOnce(mockDialogue);

      const db = new DialogueDB({ apiKey: "test-key" });
      const result = await db.getDialogue("found-id");

      expect(getDialogueMock).toHaveBeenCalledTimes(1);
      expect(getDialogueMock).toHaveBeenCalledWith(
        { id: "found-id" },
        expect.any(SettingsContainer)
      );
      expect(result).toBe(mockDialogue);
    });

    it("should get dialogue by id with namespace", async () => {
      const mockDialogue = { id: "found-id" } as unknown as Dialogue;
      getDialogueMock.mockResolvedValueOnce(mockDialogue);

      const db = new DialogueDB({ apiKey: "test-key" });
      await db.getDialogue("found-id", { namespace: "my-ns" });

      expect(getDialogueMock).toHaveBeenCalledWith(
        { id: "found-id", namespace: "my-ns" },
        expect.any(SettingsContainer)
      );
    });

    it("should return null when dialogue not found", async () => {
      getDialogueMock.mockResolvedValueOnce(null);

      const db = new DialogueDB({ apiKey: "test-key" });
      const result = await db.getDialogue("nonexistent");

      expect(result).toBeNull();
    });

    it("should pass settings to getDialogue", async () => {
      const settings = new SettingsContainer();
      settings.set("apiKey", "my-key");
      getDialogueMock.mockResolvedValueOnce(null);

      const db = new DialogueDB(settings);
      await db.getDialogue("test-id");

      expect(getDialogueMock).toHaveBeenCalledWith({ id: "test-id" }, settings);
    });
  });

  describe("createMemory", () => {
    it("should create memory with input", async () => {
      const mockMemory = { id: "my-key" } as unknown as Memory;
      createMemoryMock.mockResolvedValueOnce(mockMemory);

      const db = new DialogueDB({ apiKey: "test-key" });
      const result = await db.createMemory({
        id: "my-key",
        value: "test value",
      });

      expect(createMemoryMock).toHaveBeenCalledTimes(1);
      expect(createMemoryMock).toHaveBeenCalledWith(
        { id: "my-key", value: "test value" },
        expect.any(SettingsContainer)
      );
      expect(result).toBe(mockMemory);
    });

    it("should pass settings to createMemory", async () => {
      const settings = new SettingsContainer();
      settings.set("apiKey", "my-key");
      const mockMemory = { id: "test" } as unknown as Memory;
      createMemoryMock.mockResolvedValueOnce(mockMemory);

      const db = new DialogueDB(settings);
      await db.createMemory({ id: "test", value: 42 });

      expect(createMemoryMock).toHaveBeenCalledWith(
        { id: "test", value: 42 },
        settings
      );
    });
  });

  describe("getMemory", () => {
    it("should get memory by id", async () => {
      const mockMemory = { id: "found-key" } as unknown as Memory;
      getMemoryMock.mockResolvedValueOnce(mockMemory);

      const db = new DialogueDB({ apiKey: "test-key" });
      const result = await db.getMemory("found-key");

      expect(getMemoryMock).toHaveBeenCalledTimes(1);
      expect(getMemoryMock).toHaveBeenCalledWith(
        { id: "found-key" },
        expect.any(SettingsContainer)
      );
      expect(result).toBe(mockMemory);
    });

    it("should get memory by id with namespace", async () => {
      const mockMemory = { id: "found-key" } as unknown as Memory;
      getMemoryMock.mockResolvedValueOnce(mockMemory);

      const db = new DialogueDB({ apiKey: "test-key" });
      await db.getMemory("found-key", { namespace: "my-ns" });

      expect(getMemoryMock).toHaveBeenCalledWith(
        { id: "found-key", namespace: "my-ns" },
        expect.any(SettingsContainer)
      );
    });

    it("should return null when memory not found", async () => {
      getMemoryMock.mockResolvedValueOnce(null);

      const db = new DialogueDB({ apiKey: "test-key" });
      const result = await db.getMemory("nonexistent");

      expect(result).toBeNull();
    });

    it("should pass settings to getMemory", async () => {
      const settings = new SettingsContainer();
      settings.set("apiKey", "my-key");
      getMemoryMock.mockResolvedValueOnce(null);

      const db = new DialogueDB(settings);
      await db.getMemory("test-id");

      expect(getMemoryMock).toHaveBeenCalledWith({ id: "test-id" }, settings);
    });
  });

  describe("searchDialogues", () => {
    it("should search dialogues with query", async () => {
      const mockDialogues = [{ id: "d1" }, { id: "d2" }] as Dialogue[];
      searchDialoguesMock.mockResolvedValueOnce(mockDialogues);

      const db = new DialogueDB({ apiKey: "test-key" });
      const result = await db.searchDialogues("test query");

      expect(searchDialoguesMock).toHaveBeenCalledTimes(1);
      expect(searchDialoguesMock).toHaveBeenCalledWith(
        "test query",
        {},
        expect.any(SettingsContainer)
      );
      expect(result).toBe(mockDialogues);
    });

    it("should search dialogues with options", async () => {
      const mockDialogues = [] as Dialogue[];
      searchDialoguesMock.mockResolvedValueOnce(mockDialogues);

      const db = new DialogueDB({ apiKey: "test-key" });
      const result = await db.searchDialogues("query", { limit: 10 });

      expect(searchDialoguesMock).toHaveBeenCalledWith(
        "query",
        { limit: 10 },
        expect.any(SettingsContainer)
      );
      expect(result).toBe(mockDialogues);
    });

    it("should pass settings to searchDialogues", async () => {
      const settings = new SettingsContainer();
      settings.set("apiKey", "my-key");
      searchDialoguesMock.mockResolvedValueOnce([]);

      const db = new DialogueDB(settings);
      await db.searchDialogues("query", { limit: 5 });

      expect(searchDialoguesMock).toHaveBeenCalledWith(
        "query",
        { limit: 5 },
        settings
      );
    });
  });

  describe("searchMessages", () => {
    it("should search messages with query", async () => {
      const mockMessages = [{ id: "m1" }, { id: "m2" }] as Message[];
      searchMessagesMock.mockResolvedValueOnce(mockMessages);

      const db = new DialogueDB({ apiKey: "test-key" });
      const result = await db.searchMessages("test query");

      expect(searchMessagesMock).toHaveBeenCalledTimes(1);
      expect(searchMessagesMock).toHaveBeenCalledWith(
        "test query",
        {},
        expect.any(SettingsContainer)
      );
      expect(result).toBe(mockMessages);
    });

    it("should search messages with options", async () => {
      const mockMessages = [] as Message[];
      searchMessagesMock.mockResolvedValueOnce(mockMessages);

      const db = new DialogueDB({ apiKey: "test-key" });
      const result = await db.searchMessages("query", { limit: 20 });

      expect(searchMessagesMock).toHaveBeenCalledWith(
        "query",
        { limit: 20 },
        expect.any(SettingsContainer)
      );
      expect(result).toBe(mockMessages);
    });

    it("should pass settings to searchMessages", async () => {
      const settings = new SettingsContainer();
      settings.set("apiKey", "my-key");
      searchMessagesMock.mockResolvedValueOnce([]);

      const db = new DialogueDB(settings);
      await db.searchMessages("query");

      expect(searchMessagesMock).toHaveBeenCalledWith("query", {}, settings);
    });
  });

  describe("searchMemories", () => {
    it("should search memories with query", async () => {
      const mockMemories = [{ id: "k1" }, { id: "k2" }] as Memory[];
      searchMemoriesMock.mockResolvedValueOnce(mockMemories);

      const db = new DialogueDB({ apiKey: "test-key" });
      const result = await db.searchMemories("test query");

      expect(searchMemoriesMock).toHaveBeenCalledTimes(1);
      expect(searchMemoriesMock).toHaveBeenCalledWith(
        "test query",
        {},
        expect.any(SettingsContainer)
      );
      expect(result).toBe(mockMemories);
    });

    it("should search memories with options", async () => {
      const mockMemories = [] as Memory[];
      searchMemoriesMock.mockResolvedValueOnce(mockMemories);

      const db = new DialogueDB({ apiKey: "test-key" });
      const result = await db.searchMemories("query", { limit: 15 });

      expect(searchMemoriesMock).toHaveBeenCalledWith(
        "query",
        { limit: 15 },
        expect.any(SettingsContainer)
      );
      expect(result).toBe(mockMemories);
    });

    it("should pass settings to searchMemories", async () => {
      const settings = new SettingsContainer();
      settings.set("apiKey", "my-key");
      searchMemoriesMock.mockResolvedValueOnce([]);

      const db = new DialogueDB(settings);
      await db.searchMemories("query");

      expect(searchMemoriesMock).toHaveBeenCalledWith("query", {}, settings);
    });
  });

  describe("listDialogues", () => {
    const listDialoguesMock = listDialogues as jest.Mock;

    it("should list dialogues with default empty input", async () => {
      const mockResponse = { items: [], next: undefined };
      listDialoguesMock.mockResolvedValueOnce(mockResponse);

      const db = new DialogueDB({ apiKey: "test-key" });
      const result = await db.listDialogues();

      expect(listDialoguesMock).toHaveBeenCalledWith(
        {},
        expect.any(SettingsContainer)
      );
      expect(result).toBe(mockResponse);
    });

    it("should list dialogues with filters", async () => {
      const mockResponse = { items: [{ id: "d1" }], next: "token" };
      listDialoguesMock.mockResolvedValueOnce(mockResponse);

      const db = new DialogueDB({ apiKey: "test-key" });
      await db.listDialogues({ limit: 10, threadOf: "parent" });

      expect(listDialoguesMock).toHaveBeenCalledWith(
        { limit: 10, threadOf: "parent" },
        expect.any(SettingsContainer)
      );
    });

    it("should pass settings to listDialogues", async () => {
      const settings = new SettingsContainer();
      settings.set("apiKey", "my-key");
      listDialoguesMock.mockResolvedValueOnce({ items: [] });

      const db = new DialogueDB(settings);
      await db.listDialogues();

      expect(listDialoguesMock).toHaveBeenCalledWith({}, settings);
    });
  });

  describe("getOrCreateDialogue", () => {
    it("should call getOrCreateDialogue with input", async () => {
      const mockDialogue = { id: "test-id" } as unknown as Dialogue;
      getOrCreateDialogueMock.mockResolvedValueOnce(mockDialogue);

      const db = new DialogueDB({ apiKey: "test-key" });
      const result = await db.getOrCreateDialogue({ id: "test-id" });

      expect(getOrCreateDialogueMock).toHaveBeenCalledWith(
        { id: "test-id" },
        expect.any(SettingsContainer)
      );
      expect(result).toBe(mockDialogue);
    });

    it("should call getOrCreateDialogue without input", async () => {
      const mockDialogue = { id: "new-id" } as unknown as Dialogue;
      getOrCreateDialogueMock.mockResolvedValueOnce(mockDialogue);

      const db = new DialogueDB({ apiKey: "test-key" });
      const result = await db.getOrCreateDialogue();

      expect(getOrCreateDialogueMock).toHaveBeenCalledWith(
        undefined,
        expect.any(SettingsContainer)
      );
      expect(result).toBe(mockDialogue);
    });
  });

  describe("deleteDialogue", () => {
    it("should delete dialogue by id", async () => {
      dialogueRemoveMock.mockResolvedValueOnce(undefined);

      const db = new DialogueDB({ apiKey: "test-key" });
      await db.deleteDialogue("dialogue-123");

      expect(dialogueRemoveMock).toHaveBeenCalledWith(
        { id: "dialogue-123" },
        expect.any(SettingsContainer)
      );
    });

    it("should delete dialogue by id with namespace", async () => {
      dialogueRemoveMock.mockResolvedValueOnce(undefined);

      const db = new DialogueDB({ apiKey: "test-key" });
      await db.deleteDialogue("dialogue-123", { namespace: "my-ns" });

      expect(dialogueRemoveMock).toHaveBeenCalledWith(
        { id: "dialogue-123", namespace: "my-ns" },
        expect.any(SettingsContainer)
      );
    });
  });

  describe("listMemories", () => {
    it("should list memories with default empty input", async () => {
      memoryListMock.mockResolvedValueOnce({ items: [], next: undefined });

      const db = new DialogueDB({ apiKey: "test-key" });
      const result = await db.listMemories();

      expect(memoryListMock).toHaveBeenCalledWith(
        {},
        expect.any(SettingsContainer)
      );
      expect(result.items).toEqual([]);
    });

    it("should list memories with filters", async () => {
      memoryListMock.mockResolvedValueOnce({ items: [{ id: "m1" }] });

      const db = new DialogueDB({ apiKey: "test-key" });
      await db.listMemories({ limit: 10, namespace: "my-ns" });

      expect(memoryListMock).toHaveBeenCalledWith(
        { limit: 10, namespace: "my-ns" },
        expect.any(SettingsContainer)
      );
    });
  });

  describe("deleteMemory", () => {
    it("should delete memory by id", async () => {
      memoryRemoveMock.mockResolvedValueOnce(undefined);

      const db = new DialogueDB({ apiKey: "test-key" });
      await db.deleteMemory("memory-123");

      expect(memoryRemoveMock).toHaveBeenCalledWith(
        { id: "memory-123" },
        expect.any(SettingsContainer)
      );
    });

    it("should delete memory by id with namespace", async () => {
      memoryRemoveMock.mockResolvedValueOnce(undefined);

      const db = new DialogueDB({ apiKey: "test-key" });
      await db.deleteMemory("memory-123", { namespace: "my-ns" });

      expect(memoryRemoveMock).toHaveBeenCalledWith(
        { id: "memory-123", namespace: "my-ns" },
        expect.any(SettingsContainer)
      );
    });
  });

  describe("settings isolation", () => {
    it("should use same settings instance across all methods", async () => {
      const settings = new SettingsContainer();
      settings.set("apiKey", "consistent-key");

      createDialogueMock.mockResolvedValue({ id: "d" });
      getDialogueMock.mockResolvedValue(null);
      createMemoryMock.mockResolvedValue({ id: "k" });
      getMemoryMock.mockResolvedValue(null);
      searchDialoguesMock.mockResolvedValue([]);
      searchMessagesMock.mockResolvedValue([]);
      searchMemoriesMock.mockResolvedValue([]);

      const db = new DialogueDB(settings);

      await db.createDialogue();
      await db.getDialogue("id");
      await db.createMemory({ value: "v" });
      await db.getMemory("id");
      await db.searchDialogues("q");
      await db.searchMessages("q");
      await db.searchMemories("q");

      // All calls should use the same settings instance
      expect(createDialogueMock).toHaveBeenCalledWith(
        expect.anything(),
        settings
      );
      expect(getDialogueMock).toHaveBeenCalledWith(expect.anything(), settings);
      expect(createMemoryMock).toHaveBeenCalledWith(
        expect.anything(),
        settings
      );
      expect(getMemoryMock).toHaveBeenCalledWith(expect.anything(), settings);
      expect(searchDialoguesMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        settings
      );
      expect(searchMessagesMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        settings
      );
      expect(searchMemoriesMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        settings
      );
    });
  });
});
