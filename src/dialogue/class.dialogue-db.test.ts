import { DialogueDB } from "./class.dialogue-db";
import { Dialogue } from "./class.dialogue";
import { Memory } from "./class.memory";
import { Message } from "./class.message";
import { createDialogue } from "@/methods/createDialogue";
import { getDialogue } from "@/methods/getDialogue";
import { createMemory } from "@/methods/createMemory";
import { getMemory } from "@/methods/getMemory";
import {
  searchDialogues,
  searchMessages,
  searchMemories,
} from "@/methods/search";
import { SettingsContainer } from "@/settings/class.SettingsContainer";

jest.mock("@/methods/createDialogue");
jest.mock("@/methods/getDialogue");
jest.mock("@/methods/createMemory");
jest.mock("@/methods/getMemory");
jest.mock("@/methods/search");

describe("DialogueDB", () => {
  const createDialogueMock = createDialogue as jest.Mock;
  const getDialogueMock = getDialogue as jest.Mock;
  const createMemoryMock = createMemory as jest.Mock;
  const getMemoryMock = getMemory as jest.Mock;
  const searchDialoguesMock = searchDialogues as jest.Mock;
  const searchMessagesMock = searchMessages as jest.Mock;
  const searchMemoriesMock = searchMemories as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create instance without settings", () => {
      const db = new DialogueDB();
      expect(db).toBeInstanceOf(DialogueDB);
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

      const db = new DialogueDB();
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

      const db = new DialogueDB();
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

      const db = new DialogueDB();
      const result = await db.getDialogue("found-id");

      expect(getDialogueMock).toHaveBeenCalledTimes(1);
      expect(getDialogueMock).toHaveBeenCalledWith(
        { id: "found-id" },
        expect.any(SettingsContainer)
      );
      expect(result).toBe(mockDialogue);
    });

    it("should return null when dialogue not found", async () => {
      getDialogueMock.mockResolvedValueOnce(null);

      const db = new DialogueDB();
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

      const db = new DialogueDB();
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

      const db = new DialogueDB();
      const result = await db.getMemory("found-key");

      expect(getMemoryMock).toHaveBeenCalledTimes(1);
      expect(getMemoryMock).toHaveBeenCalledWith(
        { id: "found-key" },
        expect.any(SettingsContainer)
      );
      expect(result).toBe(mockMemory);
    });

    it("should return null when memory not found", async () => {
      getMemoryMock.mockResolvedValueOnce(null);

      const db = new DialogueDB();
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

      const db = new DialogueDB();
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

      const db = new DialogueDB();
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

      const db = new DialogueDB();
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

      const db = new DialogueDB();
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

      const db = new DialogueDB();
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

      const db = new DialogueDB();
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
