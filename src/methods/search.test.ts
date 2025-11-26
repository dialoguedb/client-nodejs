import { search } from "@/api/search";
import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { getConfig } from "@/settings";
import { searchDialogues, searchMessages, searchMemories } from "./search";
import { Dialogue } from "@/dialogue/class.dialogue";
import { Message } from "@/dialogue/class.message";
import { Memory } from "@/dialogue/class.memory";

jest.mock("@/api/search", () => ({
  search: jest.fn(),
}));

const defaultSettings = new SettingsContainer();

jest.mock("@/settings", () => ({
  getConfig: jest.fn(() => defaultSettings),
}));

describe("search methods", () => {
  const searchMock = search as jest.Mock;
  const getConfigMock = getConfig as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    getConfigMock.mockReturnValue(defaultSettings);
  });

  describe("searchDialogues", () => {
    it("calls search with dialogue object type", async () => {
      const mockDialogue = {
        id: "dialogue-123",
        namespace: "test-ns",
        created: "2024-01-01T00:00:00.000Z",
        modified: "2024-01-01T00:00:00.000Z",
      };

      searchMock.mockResolvedValueOnce({ items: [mockDialogue] });

      await searchDialogues("test query");

      expect(searchMock).toHaveBeenCalledTimes(1);
      expect(searchMock).toHaveBeenCalledWith(
        expect.objectContaining({ query: "test query", object: "dialogue" }),
        expect.anything()
      );
    });

    it("returns Dialogue instances", async () => {
      const mockDialogue = {
        id: "dialogue-123",
        namespace: "test-ns",
        created: "2024-01-01T00:00:00.000Z",
        modified: "2024-01-01T00:00:00.000Z",
      };

      searchMock.mockResolvedValueOnce({ items: [mockDialogue] });

      const results = await searchDialogues("test query");

      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(Dialogue);
      expect(results[0].id).toBe("dialogue-123");
    });

    it("passes options to search", async () => {
      searchMock.mockResolvedValueOnce({ items: [] });

      await searchDialogues("test query", {
        limit: 10,
        filter: { tags: ["tag1"] },
        metadata: { key: "value" },
      });

      expect(searchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "test query",
          object: "dialogue",
          limit: 10,
          filter: { tags: ["tag1"] },
          metadata: { key: "value" },
        }),
        expect.anything()
      );
    });

    it("uses provided settings config", async () => {
      const settings = new SettingsContainer();
      settings.set("apiKey", "custom-key");
      settings.set("endpoint", "https://custom.api.com");

      searchMock.mockResolvedValueOnce({ items: [] });

      await searchDialogues("test query", {}, settings);

      const calledSettings = searchMock.mock.calls[0][1];
      expect(calledSettings.get("apiKey")).toBe("custom-key");
    });

    it("uses default config when none provided", async () => {
      const defaultSettings = new SettingsContainer();
      defaultSettings.set("apiKey", "default-key");
      getConfigMock.mockReturnValue(defaultSettings);

      searchMock.mockResolvedValueOnce({ items: [] });

      await searchDialogues("test query");

      expect(searchMock).toHaveBeenCalled();
    });

    it("returns empty array when no results", async () => {
      searchMock.mockResolvedValueOnce({ items: [] });

      const results = await searchDialogues("no results");

      expect(results).toEqual([]);
    });

    it("handles multiple results", async () => {
      const mockDialogues = [
        {
          id: "dialogue-1",
          namespace: "ns",
          created: "2024-01-01T00:00:00.000Z",
          modified: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "dialogue-2",
          namespace: "ns",
          created: "2024-01-02T00:00:00.000Z",
          modified: "2024-01-02T00:00:00.000Z",
        },
        {
          id: "dialogue-3",
          namespace: "ns",
          created: "2024-01-03T00:00:00.000Z",
          modified: "2024-01-03T00:00:00.000Z",
        },
      ];

      searchMock.mockResolvedValueOnce({ items: mockDialogues });

      const results = await searchDialogues("test");

      expect(results).toHaveLength(3);
      expect(results.map((d) => d.id)).toEqual([
        "dialogue-1",
        "dialogue-2",
        "dialogue-3",
      ]);
    });
  });

  describe("searchMessages", () => {
    it("calls search with message object type", async () => {
      const mockMessage = {
        id: "message-123",
        dialogueId: "dialogue-456",
        role: "user",
        content: "test content",
        created: "2024-01-01T00:00:00.000Z",
        modified: "2024-01-01T00:00:00.000Z",
      };

      searchMock.mockResolvedValueOnce({ items: [mockMessage] });

      await searchMessages("test query");

      expect(searchMock).toHaveBeenCalledWith(
        { query: "test query", object: "message" },
        expect.any(SettingsContainer)
      );
    });

    it("returns Message instances", async () => {
      const mockMessage = {
        id: "message-123",
        dialogueId: "dialogue-456",
        role: "user",
        content: "test content",
        created: "2024-01-01T00:00:00.000Z",
        modified: "2024-01-01T00:00:00.000Z",
      };

      searchMock.mockResolvedValueOnce({ items: [mockMessage] });

      const results = await searchMessages("test query");

      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(Message);
      expect(results[0].id).toBe("message-123");
    });

    it("creates Message with correct dialogueId", async () => {
      const mockMessage = {
        id: "message-123",
        dialogueId: "dialogue-456",
        role: "user",
        content: "test content",
        created: "2024-01-01T00:00:00.000Z",
        modified: "2024-01-01T00:00:00.000Z",
      };

      searchMock.mockResolvedValueOnce({ items: [mockMessage] });

      const results = await searchMessages("test query");

      // Message class is created with dialogueId (first arg) from the response
      expect(results[0].id).toBe("message-123");
    });

    it("passes options to search", async () => {
      searchMock.mockResolvedValueOnce({ items: [] });

      await searchMessages("test query", {
        limit: 5,
        filter: { created: "2024-01-01" },
      });

      expect(searchMock).toHaveBeenCalledWith(
        {
          query: "test query",
          object: "message",
          limit: 5,
          filter: { created: "2024-01-01" },
        },
        expect.any(SettingsContainer)
      );
    });

    it("uses provided settings config", async () => {
      const settings = new SettingsContainer();
      settings.set("apiKey", "custom-key");
      settings.set("endpoint", "https://custom.api.com");

      searchMock.mockResolvedValueOnce({ items: [] });

      await searchMessages("test query", {}, settings);

      const calledSettings = searchMock.mock.calls[0][1];
      expect(calledSettings.get("apiKey")).toBe("custom-key");
    });
  });

  describe("searchMemories", () => {
    const makeMemory = (key: string) => ({
      key,
      namespace: "test-ns",
      value: "memory content",
      type: "string" as const,
      created: "2024-01-01T00:00:00.000Z",
      modified: "2024-01-01T00:00:00.000Z",
    });

    it("calls search with memory object type", async () => {
      searchMock.mockResolvedValueOnce({ items: [makeMemory("memory-123")] });

      await searchMemories("test query");

      expect(searchMock).toHaveBeenCalledWith(
        { query: "test query", object: "memory" },
        expect.any(SettingsContainer)
      );
    });

    it("returns Memory instances", async () => {
      searchMock.mockResolvedValueOnce({ items: [makeMemory("memory-123")] });

      const results = await searchMemories("test query");

      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(Memory);
      expect(results[0].key).toBe("memory-123");
    });

    it("passes options to search", async () => {
      searchMock.mockResolvedValueOnce({ items: [] });

      await searchMemories("test query", {
        limit: 20,
        filter: { tags: ["important"] },
      });

      expect(searchMock).toHaveBeenCalledWith(
        {
          query: "test query",
          object: "memory",
          limit: 20,
          filter: { tags: ["important"] },
        },
        expect.any(SettingsContainer)
      );
    });

    it("uses provided settings config", async () => {
      const settings = new SettingsContainer();
      settings.set("apiKey", "memory-api-key");
      settings.set("endpoint", "https://memory.api.com");

      searchMock.mockResolvedValueOnce({ items: [] });

      await searchMemories("test query", {}, settings);

      const calledSettings = searchMock.mock.calls[0][1];
      expect(calledSettings.get("apiKey")).toBe("memory-api-key");
    });

    it("handles multiple results", async () => {
      const mockMemories = [makeMemory("memory-1"), makeMemory("memory-2")];

      searchMock.mockResolvedValueOnce({ items: mockMemories });

      const results = await searchMemories("test");

      expect(results).toHaveLength(2);
      expect(results.map((m) => m.key)).toEqual(["memory-1", "memory-2"]);
    });
  });
});
