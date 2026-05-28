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

const baseRequest = {
  orderBy: "relevance" as const,
  order: "desc" as const,
  candidateOrderBy: "relevance" as const,
};

const wrap = <T>(results: { object: any; relevance: number; item: T; matches?: any[] }[], request = baseRequest) => ({
  results,
  request,
});

describe("search methods (wrapper shape)", () => {
  const searchMock = search as jest.Mock;
  const getConfigMock = getConfig as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    getConfigMock.mockReturnValue(defaultSettings);
  });

  describe("searchDialogues", () => {
    const mockDialogue = {
      id: "dialogue-123",
      namespace: "test-ns",
      created: "2024-01-01T00:00:00.000Z",
      modified: "2024-01-01T00:00:00.000Z",
      projectId: "p1",
      requestId: "r1",
      status: "active",
      tags: [],
    };

    it("calls raw search with object='dialogue'", async () => {
      searchMock.mockResolvedValueOnce(
        wrap([{ object: "dialogue", relevance: 0.9, item: mockDialogue }])
      );

      await searchDialogues("test query");

      expect(searchMock).toHaveBeenCalledWith(
        expect.objectContaining({ query: "test query", object: "dialogue" }),
        expect.anything()
      );
    });

    it("returns wrapper response with hydrated Dialogue instances and preserved relevance", async () => {
      searchMock.mockResolvedValueOnce(
        wrap([{ object: "dialogue", relevance: 0.87, item: mockDialogue }])
      );

      const response = await searchDialogues("test query");

      expect(response.request).toEqual(baseRequest);
      expect(response.results).toHaveLength(1);
      expect(response.results[0].relevance).toBe(0.87);
      expect(response.results[0].object).toBe("dialogue");
      expect(response.results[0].item).toBeInstanceOf(Dialogue);
      expect(response.results[0].item.id).toBe("dialogue-123");
    });

    it("hydrates matches[].item into Message instances", async () => {
      const mockMatchMessage = {
        id: "msg-1",
        dialogueId: "dialogue-123",
        role: "user",
        content: "hi",
        created: "2024-01-01T00:00:00.000Z",
        modified: "2024-01-01T00:00:00.000Z",
        tags: [],
        metadata: {},
      };

      searchMock.mockResolvedValueOnce(
        wrap([
          {
            object: "dialogue",
            relevance: 0.9,
            item: mockDialogue,
            matches: [
              { object: "message", relevance: 0.95, item: mockMatchMessage },
            ],
          },
        ])
      );

      const response = await searchDialogues("test query");

      const matches = response.results[0].matches!;
      expect(matches).toHaveLength(1);
      expect(matches[0].item).toBeInstanceOf(Message);
      expect(matches[0].item.id).toBe("msg-1");
      expect(matches[0].relevance).toBe(0.95);
    });

    it("propagates new options (timezone, orderBy, order, tag operators, range filter, metadata operators)", async () => {
      searchMock.mockResolvedValueOnce(wrap([]));

      await searchDialogues("test query", {
        limit: 10,
        timezone: "America/Chicago",
        tags: { $all: ["urgent", "billing"] },
        filter: { created: { gte: "2025-03-01T00:00:00Z", lt: "2025-04-01T00:00:00Z" } },
        metadata: { tier: { $in: ["pro", "enterprise"] } },
        orderBy: "created",
        order: "asc",
      });

      expect(searchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "test query",
          object: "dialogue",
          limit: 10,
          timezone: "America/Chicago",
          tags: { $all: ["urgent", "billing"] },
          filter: { created: { gte: "2025-03-01T00:00:00Z", lt: "2025-04-01T00:00:00Z" } },
          metadata: { tier: { $in: ["pro", "enterprise"] } },
          orderBy: "created",
          order: "asc",
        }),
        expect.anything()
      );
    });

    it("propagates bare-array tags as-is (server applies $in semantics)", async () => {
      searchMock.mockResolvedValueOnce(wrap([]));

      await searchDialogues("q", { tags: ["urgent"] });

      expect(searchMock).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ["urgent"] }),
        expect.anything()
      );
    });

    it("surfaces request.filter echo when server reports NL parsing", async () => {
      searchMock.mockResolvedValueOnce(
        wrap(
          [],
          {
            ...baseRequest,
            filter: {
              created: { gte: "2025-03-01T00:00:00Z", lt: "2025-04-01T00:00:00Z" },
            },
          } as any
        )
      );

      const response = await searchDialogues("q", {
        filter: { created: "March 2025" },
        timezone: "America/Chicago",
      });

      expect(response.request.filter?.created).toEqual({
        gte: "2025-03-01T00:00:00Z",
        lt: "2025-04-01T00:00:00Z",
      });
    });

    it("returns an empty results array when no results", async () => {
      searchMock.mockResolvedValueOnce(wrap([]));

      const response = await searchDialogues("nope");

      expect(response.results).toEqual([]);
    });

    it("uses provided settings config", async () => {
      const settings = new SettingsContainer();
      settings.set("apiKey", "custom-key");
      searchMock.mockResolvedValueOnce(wrap([]));

      await searchDialogues("q", {}, settings);

      const calledSettings = searchMock.mock.calls[0][1];
      expect(calledSettings.get("apiKey")).toBe("custom-key");
    });
  });

  describe("searchMessages", () => {
    const mockMessage = {
      id: "message-123",
      dialogueId: "dialogue-456",
      role: "user",
      content: "test content",
      created: "2024-01-01T00:00:00.000Z",
      modified: "2024-01-01T00:00:00.000Z",
      tags: [],
      metadata: {},
    };

    it("calls raw search with object='message'", async () => {
      searchMock.mockResolvedValueOnce(
        wrap([{ object: "message", relevance: 0.5, item: mockMessage }])
      );

      await searchMessages("test query");

      expect(searchMock).toHaveBeenCalledWith(
        expect.objectContaining({ query: "test query", object: "message" }),
        expect.anything()
      );
    });

    it("returns wrapper response with hydrated Message instances", async () => {
      searchMock.mockResolvedValueOnce(
        wrap([{ object: "message", relevance: 0.5, item: mockMessage }])
      );

      const response = await searchMessages("test query");

      expect(response.results).toHaveLength(1);
      expect(response.results[0].item).toBeInstanceOf(Message);
      expect(response.results[0].item.id).toBe("message-123");
      expect(response.results[0].relevance).toBe(0.5);
    });
  });

  describe("searchMemories", () => {
    const makeMemory = (id: string) => ({
      id,
      namespace: "test-ns",
      value: "memory content",
      type: "string" as const,
      tags: [],
      metadata: {},
      created: "2024-01-01T00:00:00.000Z",
      modified: "2024-01-01T00:00:00.000Z",
    });

    it("calls raw search with object='memory'", async () => {
      searchMock.mockResolvedValueOnce(
        wrap([{ object: "memory", relevance: 0.7, item: makeMemory("m1") }])
      );

      await searchMemories("test query");

      expect(searchMock).toHaveBeenCalledWith(
        expect.objectContaining({ query: "test query", object: "memory" }),
        expect.anything()
      );
    });

    it("returns wrapper response with hydrated Memory instances", async () => {
      searchMock.mockResolvedValueOnce(
        wrap([
          { object: "memory", relevance: 0.7, item: makeMemory("m1") },
          { object: "memory", relevance: 0.6, item: makeMemory("m2") },
        ])
      );

      const response = await searchMemories("test query");

      expect(response.results).toHaveLength(2);
      expect(response.results[0].item).toBeInstanceOf(Memory);
      expect(response.results.map((r) => r.item.id)).toEqual(["m1", "m2"]);
      expect(response.results.map((r) => r.relevance)).toEqual([0.7, 0.6]);
    });
  });

  describe("flattening helper", () => {
    it("callers can flatten to domain instances with results.map((r) => r.item)", async () => {
      const mockDialogue = {
        id: "d-1",
        namespace: "ns",
        created: "2024-01-01T00:00:00.000Z",
        modified: "2024-01-01T00:00:00.000Z",
        projectId: "p1",
        requestId: "r1",
        status: "active",
        tags: [],
      };

      searchMock.mockResolvedValueOnce(
        wrap([{ object: "dialogue", relevance: 0.9, item: mockDialogue }])
      );

      const response = await searchDialogues("q");
      const flat = response.results.map((r) => r.item);

      expect(flat).toHaveLength(1);
      expect(flat[0]).toBeInstanceOf(Dialogue);
      expect(flat[0].id).toBe("d-1");
    });
  });
});
