import { Dialogue } from "./class.dialogue";
import * as dialogueApi from "@/api/dialogue";
import * as messageApi from "@/api/message";
import * as messagesApi from "@/api/messages";
import { IDialogue, IMessage } from "@/types";

jest.mock("@/api/dialogue", () => ({
  update: jest.fn(),
  create: jest.fn(),
  list: jest.fn(),
  end: jest.fn(),
}));

jest.mock("@/api/message", () => ({
  create: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
}));

jest.mock("@/api/messages", () => ({
  create: jest.fn(),
  list: jest.fn(),
}));

function createMockDialogue(overrides: Partial<IDialogue> = {}): IDialogue {
  return {
    id: Math.random().toString(36).slice(2),
    projectId: "test-project",
    requestId: "test-request",
    status: "active",
    state: {},
    messages: [],
    metadata: {},
    tags: [],
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    ...overrides,
  };
}

function createMockMessage(overrides: Partial<IMessage> = {}): IMessage {
  return {
    id: Math.random().toString(36).slice(2),
    dialogueId: "test-dialogue",
    role: "user",
    content: "test content",
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    metadata: {},
    tags: [],
    ...overrides,
  };
}

describe("Dialogue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor validation", () => {
    it("creates dialogue with valid data", () => {
      const id = Math.random().toString(36).slice(2);
      const dialogue = new Dialogue(createMockDialogue({ id }));

      expect(dialogue.id).toBe(id);
      expect(dialogue.messages).toEqual([]);
      expect(dialogue.state).toEqual({});
      expect(dialogue.tags).toEqual([]);
      expect(dialogue.isDirty).toBe(false);
    });

    it("exposes all optional fields when provided", () => {
      const dialogue = new Dialogue(
        createMockDialogue({
          threadOf: "parent-123",
          label: "Test Label",
          archivedAt: "2024-06-01T00:00:00.000Z",
          endedAt: "2024-05-01T00:00:00.000Z",
          totalMessages: 42,
          threadCount: 3,
          lastMessageCreated: "2024-07-01T00:00:00.000Z",
        })
      );

      expect(dialogue.threadOf).toBe("parent-123");
      expect(dialogue.label).toBe("Test Label");
      expect(dialogue.archivedAt).toBe("2024-06-01T00:00:00.000Z");
      expect(dialogue.endedAt).toBe("2024-05-01T00:00:00.000Z");
      expect(dialogue.totalMessages).toBe(42);
      expect(dialogue.threadCount).toBe(3);
      expect(dialogue.lastMessageCreated).toBe("2024-07-01T00:00:00.000Z");
    });

    it("exposes projectId, requestId, and status", () => {
      const dialogue = new Dialogue(
        createMockDialogue({
          projectId: "proj-123",
          requestId: "req-456",
          status: "ended",
        })
      );

      expect(dialogue.projectId).toBe("proj-123");
      expect(dialogue.requestId).toBe("req-456");
      expect(dialogue.status).toBe("ended");
    });

    it("throws when id is missing", () => {
      expect(() => {
        new Dialogue({ ...createMockDialogue(), id: undefined as any });
      }).toThrow("Invalid id: is required and must be a string");
    });

    it("throws when id is not a string", () => {
      expect(() => {
        new Dialogue({ ...createMockDialogue(), id: 123 as any });
      }).toThrow("Invalid id: is required and must be a string");
    });

    it("throws when id is empty string", () => {
      expect(() => {
        new Dialogue({ ...createMockDialogue(), id: "" });
      }).toThrow("Invalid id: is required and must be a string");
    });

    it("throws when dialogue object is null", () => {
      expect(() => {
        new Dialogue(null as any);
      }).toThrow("Invalid id: is required and must be a string");
    });

    it("throws when dialogue object is undefined", () => {
      expect(() => {
        new Dialogue(undefined as any);
      }).toThrow("Invalid id: is required and must be a string");
    });

    it("throws when tags contains non-strings", () => {
      expect(() => {
        new Dialogue(createMockDialogue({ tags: ["valid", 123 as any] }));
      }).toThrow("Invalid tags: must be array of strings");
    });

    it("accepts optional namespace", () => {
      const dialogue = new Dialogue(
        createMockDialogue({ namespace: "my-namespace" })
      );
      expect(dialogue.namespace).toBe("my-namespace");
    });

    it("namespace is undefined when not provided", () => {
      const dialogue = new Dialogue(createMockDialogue());
      expect(dialogue.namespace).toBeUndefined();
    });

    it("generates timestamps when not provided", () => {
      const data = createMockDialogue();
      delete (data as any).created;
      delete (data as any).modified;

      const dialogue = new Dialogue(data);

      expect(dialogue.created).toBeDefined();
      expect(dialogue.modified).toBeDefined();
    });

    it("uses created as modified when modified not provided", () => {
      const created = "2024-01-01T00:00:00.000Z";
      const data = createMockDialogue({ created });
      delete (data as any).modified;

      const dialogue = new Dialogue(data);

      expect(dialogue.modified).toBe(created);
    });
  });

  describe("mutation isolation", () => {
    it("deep clones metadata to prevent external mutation", () => {
      const originalMetadata = { key: "original" };
      const dialogue = new Dialogue(
        createMockDialogue({ metadata: originalMetadata })
      );

      // Mutate original - should not affect dialogue
      originalMetadata.key = "mutated";

      expect(dialogue.metadata).toEqual({ key: "original" });
    });

    it("metadata getter returns copy to prevent mutation", () => {
      const dialogue = new Dialogue(
        createMockDialogue({ metadata: { key: "value" } })
      );

      const retrieved = dialogue.metadata;
      (retrieved as any).key = "mutated";

      expect(dialogue.metadata.key).toBe("value");
    });

    it("metadata getter returns deep clone - nested mutation does not affect internal metadata", () => {
      const dialogue = new Dialogue(
        createMockDialogue({
          metadata: { nested: { deep: "original" } } as any,
        })
      );

      const retrieved = dialogue.metadata as any;
      retrieved.nested.deep = "mutated";

      expect((dialogue.metadata as any).nested.deep).toBe("original");
    });

    it("deep clones state from constructor input", () => {
      const originalState = { nested: { count: 5 } };
      const dialogue = new Dialogue(
        createMockDialogue({ state: originalState })
      );

      // Mutate original - should not affect dialogue
      originalState.nested.count = 999;

      expect(dialogue.state).toEqual({ nested: { count: 5 } });
    });

    it("state setter deep clones the value", () => {
      const dialogue = new Dialogue(createMockDialogue());
      const newState = { nested: { value: "test" } };

      dialogue.state = newState;
      newState.nested.value = "mutated";

      expect(dialogue.state.nested.value).toBe("test");
    });

    it("copies tags array from constructor", () => {
      const originalTags = ["tag1", "tag2"];
      const dialogue = new Dialogue(createMockDialogue({ tags: originalTags }));

      originalTags.push("tag3");

      expect(dialogue.tags).toEqual(["tag1", "tag2"]);
    });

    it("state getter returns clone - external mutation does not affect internal state", () => {
      const dialogue = new Dialogue(
        createMockDialogue({ state: { original: true } })
      );

      const retrieved = dialogue.state;
      retrieved.sneaky = "mutation";

      // Internal state should be unchanged
      expect(dialogue.state).toEqual({ original: true });
      expect(dialogue.state).not.toHaveProperty("sneaky");
      expect(dialogue.isDirty).toBe(false);
    });

    it("tags getter returns clone - external mutation does not affect internal tags", () => {
      const dialogue = new Dialogue(createMockDialogue({ tags: ["original"] }));

      const retrieved = dialogue.tags;
      retrieved.push("sneaky");

      // Internal tags should be unchanged
      expect(dialogue.tags).toEqual(["original"]);
      expect(dialogue.tags).not.toContain("sneaky");
      expect(dialogue.isDirty).toBe(false);
    });
  });

  describe("state management", () => {
    it("setting state marks dialogue as dirty", () => {
      const dialogue = new Dialogue(createMockDialogue());

      expect(dialogue.isDirty).toBe(false);
      dialogue.state = { key: "value" };
      expect(dialogue.isDirty).toBe(true);
    });

    it("setState sets state locally and returns this for chaining", () => {
      const dialogue = new Dialogue(createMockDialogue());
      const newState = { step: 2, context: "onboarding" };

      const result = dialogue.setState(newState);

      expect(dialogue.state).toEqual(newState);
      expect(dialogue.isDirty).toBe(true);
      expect(result).toBe(dialogue);
    });

    it("setState does not call API", () => {
      const dialogue = new Dialogue(createMockDialogue());
      dialogue.setState({ key: "value" });

      expect(dialogueApi.update).not.toHaveBeenCalled();
    });

    it("setState deep clones the value", () => {
      const dialogue = new Dialogue(createMockDialogue());
      const state = { nested: { value: "original" } };

      dialogue.setState(state);
      state.nested.value = "mutated";

      expect(dialogue.state.nested.value).toBe("original");
    });

    it("saveState sets state and calls save", async () => {
      const id = Math.random().toString(36).slice(2);
      const newState = { step: 2 };
      const updatedModified = new Date().toISOString();

      (dialogueApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockDialogue({ id }),
        state: newState,
        modified: updatedModified,
      });

      const dialogue = new Dialogue(createMockDialogue({ id }));
      await dialogue.saveState(newState);

      expect(dialogueApi.update).toHaveBeenCalledWith(
        expect.objectContaining({ id, state: newState }),
        expect.anything()
      );
      expect(dialogue.state).toEqual(newState);
      expect(dialogue.isDirty).toBe(false);
    });
  });

  describe("label management", () => {
    it("setting label marks dialogue as dirty", () => {
      const dialogue = new Dialogue(createMockDialogue());

      expect(dialogue.isDirty).toBe(false);
      dialogue.label = "New Label";
      expect(dialogue.isDirty).toBe(true);
      expect(dialogue.label).toBe("New Label");
    });

    it("allows setting label to undefined", () => {
      const dialogue = new Dialogue(createMockDialogue({ label: "Original" }));

      dialogue.label = undefined;

      expect(dialogue.label).toBeUndefined();
      expect(dialogue.isDirty).toBe(true);
    });

    it("saves label when save() is called", async () => {
      const id = Math.random().toString(36).slice(2);

      (dialogueApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockDialogue({ id }),
        label: "Saved Label",
        modified: new Date().toISOString(),
      });

      const dialogue = new Dialogue(createMockDialogue({ id }));
      dialogue.label = "Saved Label";
      await dialogue.save();

      const callPayload = (dialogueApi.update as jest.Mock).mock.calls[0][0];
      expect(callPayload).toHaveProperty("label", "Saved Label");
    });

    it("syncs label from server response after save", async () => {
      const id = Math.random().toString(36).slice(2);

      (dialogueApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockDialogue({ id }),
        label: "Server Label",
        state: {},
        tags: [],
        modified: new Date().toISOString(),
      });

      const dialogue = new Dialogue(createMockDialogue({ id }));
      dialogue.label = "Client Label";
      await dialogue.save();

      expect(dialogue.label).toBe("Server Label");
    });
  });

  describe("tags management", () => {
    it("setting tags marks dialogue as dirty", () => {
      const dialogue = new Dialogue(createMockDialogue());

      expect(dialogue.isDirty).toBe(false);
      dialogue.tags = ["new-tag"];
      expect(dialogue.isDirty).toBe(true);
    });

    it("throws when tags is not an array", () => {
      const dialogue = new Dialogue(createMockDialogue());

      expect(() => {
        dialogue.tags = "not-an-array" as any;
      }).toThrow("Invalid tags: must be an array");
    });

    it("throws when tags contains non-strings", () => {
      const dialogue = new Dialogue(createMockDialogue());

      expect(() => {
        dialogue.tags = ["valid", 123 as any];
      }).toThrow("Invalid tags: must be array of strings");
    });

    it("saveTags sets tags and calls save", async () => {
      const id = Math.random().toString(36).slice(2);
      const newTags = ["important", "urgent"];
      const updatedModified = new Date().toISOString();

      (dialogueApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockDialogue({ id }),
        tags: newTags,
        modified: updatedModified,
      });

      const dialogue = new Dialogue(createMockDialogue({ id }));
      await dialogue.saveTags(newTags);

      expect(dialogueApi.update).toHaveBeenCalledWith(
        expect.objectContaining({ id, tags: newTags }),
        expect.anything()
      );
      expect(dialogue.tags).toEqual(newTags);
      expect(dialogue.isDirty).toBe(false);
    });
  });

  describe("save", () => {
    it("does not call API when not dirty", async () => {
      const dialogue = new Dialogue(createMockDialogue());

      await dialogue.save();

      expect(dialogueApi.update).not.toHaveBeenCalled();
    });

    it("calls API and clears dirty flag when dirty", async () => {
      const id = Math.random().toString(36).slice(2);
      const updatedModified = new Date().toISOString();

      (dialogueApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockDialogue({ id }),
        state: { key: "value" },
        tags: [],
        modified: updatedModified,
      });

      const dialogue = new Dialogue(createMockDialogue({ id }));
      dialogue.state = { key: "value" };

      expect(dialogue.isDirty).toBe(true);
      await dialogue.save();
      expect(dialogue.isDirty).toBe(false);
    });

    it("syncs state from server response after save", async () => {
      const id = Math.random().toString(36).slice(2);
      const serverState = { local: "value", server: "merged" };

      (dialogueApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockDialogue({ id }),
        state: serverState,
        tags: [],
        modified: new Date().toISOString(),
      });

      const dialogue = new Dialogue(createMockDialogue({ id }));
      dialogue.state = { local: "value" };
      await dialogue.save();

      expect(dialogue.state).toEqual(serverState);
    });

    it("syncs tags from server response after save", async () => {
      const id = Math.random().toString(36).slice(2);
      const serverTags = ["tag1", "tag2", "server-added"];

      (dialogueApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockDialogue({ id }),
        state: {},
        tags: serverTags,
        modified: new Date().toISOString(),
      });

      const dialogue = new Dialogue(createMockDialogue({ id }));
      dialogue.tags = ["tag1", "tag2"];
      await dialogue.save();

      expect(dialogue.tags).toEqual(serverTags);
    });

    it("handles server response with undefined state", async () => {
      const id = Math.random().toString(36).slice(2);

      (dialogueApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockDialogue({ id }),
        state: undefined,
        tags: [],
        modified: new Date().toISOString(),
      });

      const dialogue = new Dialogue(createMockDialogue({ id }));
      dialogue.state = { key: "value" };
      await dialogue.save();

      expect(dialogue.state).toEqual({});
    });

    it("handles server response with undefined tags", async () => {
      const id = Math.random().toString(36).slice(2);

      (dialogueApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockDialogue({ id }),
        state: {},
        tags: undefined,
        modified: new Date().toISOString(),
      });

      const dialogue = new Dialogue(createMockDialogue({ id }));
      dialogue.tags = ["tag1"];
      await dialogue.save();

      expect(dialogue.tags).toEqual([]);
    });

    it("updates modified timestamp from server response", async () => {
      const id = Math.random().toString(36).slice(2);
      const originalModified = "2024-01-01T00:00:00.000Z";
      const updatedModified = "2024-06-15T12:00:00.000Z";

      (dialogueApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockDialogue({ id }),
        state: { key: "value" },
        tags: [],
        modified: updatedModified,
      });

      const dialogue = new Dialogue(
        createMockDialogue({ id, modified: originalModified })
      );
      dialogue.state = { key: "value" };
      await dialogue.save();

      expect(dialogue.modified).toBe(updatedModified);
    });

    it("saves dirty messages when dialogue.save() is called", async () => {
      const id = Math.random().toString(36).slice(2);
      const messageId = Math.random().toString(36).slice(2);

      (dialogueApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockDialogue({ id }),
        state: { changed: true },
        tags: [],
        modified: new Date().toISOString(),
      });

      (messageApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockMessage({ id: messageId }),
        tags: ["updated"],
        modified: new Date().toISOString(),
      });

      const dialogue = new Dialogue(
        createMockDialogue({
          id,
          messages: [createMockMessage({ id: messageId })],
        })
      );

      // Make both dialogue and message dirty
      dialogue.state = { changed: true };
      dialogue.messages[0].tags = ["updated"];

      expect(dialogue.isDirty).toBe(true);

      await dialogue.save();

      expect(messageApi.update).toHaveBeenCalled();
      expect(dialogueApi.update).toHaveBeenCalled();
    });

    it("only includes state in payload when non-empty", async () => {
      const id = Math.random().toString(36).slice(2);

      (dialogueApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockDialogue({ id }),
        state: {},
        tags: ["tag"],
        modified: new Date().toISOString(),
      });

      const dialogue = new Dialogue(createMockDialogue({ id }));
      dialogue.tags = ["tag"];
      await dialogue.save();

      const callPayload = (dialogueApi.update as jest.Mock).mock.calls[0][0];
      expect(callPayload).not.toHaveProperty("state");
      expect(callPayload).toHaveProperty("tags");
    });

    it("only includes tags in payload when non-empty", async () => {
      const id = Math.random().toString(36).slice(2);

      (dialogueApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockDialogue({ id }),
        state: { key: "value" },
        tags: [],
        modified: new Date().toISOString(),
      });

      const dialogue = new Dialogue(createMockDialogue({ id }));
      dialogue.state = { key: "value" };
      await dialogue.save();

      const callPayload = (dialogueApi.update as jest.Mock).mock.calls[0][0];
      expect(callPayload).toHaveProperty("state");
      expect(callPayload).not.toHaveProperty("tags");
    });

    it("returns the dialogue instance for chaining", async () => {
      const id = Math.random().toString(36).slice(2);

      (dialogueApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockDialogue({ id }),
        state: { key: "value" },
        tags: [],
        modified: new Date().toISOString(),
      });

      const dialogue = new Dialogue(createMockDialogue({ id }));
      dialogue.state = { key: "value" };

      const result = await dialogue.save();

      expect(result).toBe(dialogue);
    });
  });

  describe("isDirty cascade", () => {
    it("isDirty reflects message dirty state", () => {
      const dialogue = new Dialogue(
        createMockDialogue({
          messages: [createMockMessage()],
        })
      );

      expect(dialogue.isDirty).toBe(false);

      dialogue.messages[0].tags = ["new-tag"];

      expect(dialogue.isDirty).toBe(true);
    });

    it("isDirty is true when dialogue is dirty but messages are clean", () => {
      const dialogue = new Dialogue(
        createMockDialogue({
          messages: [createMockMessage()],
        })
      );

      dialogue.state = { changed: true };

      expect(dialogue.isDirty).toBe(true);
    });

    it("isDirty is true when message is dirty but dialogue is clean", () => {
      const dialogue = new Dialogue(
        createMockDialogue({
          messages: [createMockMessage()],
        })
      );

      dialogue.messages[0].tags = ["modified"];

      expect(dialogue.isDirty).toBe(true);
    });
  });

  describe("saveMessage", () => {
    it("creates message via API and adds to local array", async () => {
      const dialogueId = Math.random().toString(36).slice(2);
      const messageId = Math.random().toString(36).slice(2);
      const messageContent = "Hello, world!";

      (messageApi.create as jest.Mock).mockResolvedValueOnce(
        createMockMessage({
          id: messageId,
          role: "user",
          content: messageContent,
        })
      );

      const dialogue = new Dialogue(createMockDialogue({ id: dialogueId }));

      expect(dialogue.messages.length).toBe(0);

      const message = await dialogue.saveMessage({
        role: "user",
        content: messageContent,
      });

      expect(messageApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dialogueId,
          role: "user",
          content: messageContent,
        }),
        expect.anything()
      );
      expect(dialogue.messages.length).toBe(1);
      expect(message.id).toBe(messageId);
      expect(message.content).toBe(messageContent);
    });

    it("returned message has working remove callback", async () => {
      const dialogueId = Math.random().toString(36).slice(2);
      const messageId = Math.random().toString(36).slice(2);

      (messageApi.create as jest.Mock).mockResolvedValueOnce(
        createMockMessage({ id: messageId })
      );
      (messageApi.remove as jest.Mock).mockResolvedValueOnce({});

      const dialogue = new Dialogue(createMockDialogue({ id: dialogueId }));
      await dialogue.saveMessage({ role: "user", content: "test" });

      expect(dialogue.messages.length).toBe(1);

      await dialogue.messages[0].remove();

      expect(dialogue.messages.length).toBe(0);
    });
  });

  describe("saveMessages", () => {
    it("creates multiple messages and adds all to local array", async () => {
      const dialogueId = Math.random().toString(36).slice(2);
      const msg1Id = Math.random().toString(36).slice(2);
      const msg2Id = Math.random().toString(36).slice(2);

      (messagesApi.create as jest.Mock).mockResolvedValueOnce([
        createMockMessage({ id: msg1Id, content: "First" }),
        createMockMessage({ id: msg2Id, content: "Second" }),
      ]);

      const dialogue = new Dialogue(createMockDialogue({ id: dialogueId }));

      const messages = await dialogue.saveMessages([
        { role: "user", content: "First" },
        { role: "assistant", content: "Second" },
      ]);

      expect(messages.length).toBe(2);
      expect(dialogue.messages.length).toBe(2);
      expect(dialogue.messages[0].content).toBe("First");
      expect(dialogue.messages[1].content).toBe("Second");
    });
  });

  describe("loadMessages", () => {
    it("replaces local messages on initial load", async () => {
      const dialogueId = Math.random().toString(36).slice(2);
      const existingMsgId = Math.random().toString(36).slice(2);
      const loadedMsgId = Math.random().toString(36).slice(2);

      (messagesApi.list as jest.Mock).mockResolvedValueOnce({
        items: [createMockMessage({ id: loadedMsgId, content: "Loaded" })],
        next: undefined,
      });

      const dialogue = new Dialogue(
        createMockDialogue({
          id: dialogueId,
          messages: [
            createMockMessage({ id: existingMsgId, content: "Existing" }),
          ],
        })
      );

      expect(dialogue.messages.length).toBe(1);
      expect(dialogue.messages[0].id).toBe(existingMsgId);

      await dialogue.loadMessages({ limit: 50 });

      expect(dialogue.messages.length).toBe(1);
      expect(dialogue.messages[0].id).toBe(loadedMsgId);
    });

    it("appends messages when next: true", async () => {
      const dialogueId = Math.random().toString(36).slice(2);
      const existingMsgId = Math.random().toString(36).slice(2);
      const loadedMsgId = Math.random().toString(36).slice(2);

      // First load
      (messagesApi.list as jest.Mock).mockResolvedValueOnce({
        items: [createMockMessage({ id: existingMsgId })],
        next: "token123",
      });

      const dialogue = new Dialogue(createMockDialogue({ id: dialogueId }));
      await dialogue.loadMessages({ limit: 50 });

      expect(dialogue.messages.length).toBe(1);
      expect(dialogue.hasMoreMessages).toBe(true);

      // Second load with pagination
      (messagesApi.list as jest.Mock).mockResolvedValueOnce({
        items: [createMockMessage({ id: loadedMsgId })],
        next: undefined,
      });

      await dialogue.loadMessages({ limit: 50, next: true });

      expect(dialogue.messages.length).toBe(2);
      expect(dialogue.hasMoreMessages).toBe(false);
    });

    it("uses stored nextToken when next: true", async () => {
      const dialogueId = Math.random().toString(36).slice(2);
      const nextToken = "pagination-token-abc";

      (messagesApi.list as jest.Mock)
        .mockResolvedValueOnce({
          items: [createMockMessage()],
          next: nextToken,
        })
        .mockResolvedValueOnce({
          items: [],
          next: undefined,
        });

      const dialogue = new Dialogue(createMockDialogue({ id: dialogueId }));
      await dialogue.loadMessages({ limit: 10 });
      await dialogue.loadMessages({ limit: 10, next: true });

      expect(messagesApi.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ next: nextToken }),
        expect.anything()
      );
    });

    it("returns loaded messages", async () => {
      const dialogueId = Math.random().toString(36).slice(2);
      const msgId = Math.random().toString(36).slice(2);

      (messagesApi.list as jest.Mock).mockResolvedValueOnce({
        items: [createMockMessage({ id: msgId })],
        next: undefined,
      });

      const dialogue = new Dialogue(createMockDialogue({ id: dialogueId }));
      const loaded = await dialogue.loadMessages();

      expect(loaded.length).toBe(1);
      expect(loaded[0].id).toBe(msgId);
    });

    it("handles undefined options parameter", async () => {
      const dialogueId = Math.random().toString(36).slice(2);

      (messagesApi.list as jest.Mock).mockResolvedValueOnce({
        items: [],
        next: undefined,
      });

      const dialogue = new Dialogue(createMockDialogue({ id: dialogueId }));
      await dialogue.loadMessages(undefined);

      expect(messagesApi.list).toHaveBeenCalledWith(
        expect.objectContaining({ dialogueId }),
        expect.anything()
      );
    });
  });

  describe("deleteMessage", () => {
    it("calls API and removes from local array", async () => {
      const dialogueId = Math.random().toString(36).slice(2);
      const messageId = Math.random().toString(36).slice(2);

      (messageApi.remove as jest.Mock).mockResolvedValueOnce({});

      const dialogue = new Dialogue(
        createMockDialogue({
          id: dialogueId,
          messages: [createMockMessage({ id: messageId })],
        })
      );

      expect(dialogue.messages.length).toBe(1);

      await dialogue.deleteMessage(messageId);

      expect(messageApi.remove).toHaveBeenCalledWith(
        { dialogueId, id: messageId },
        expect.anything()
      );
      expect(dialogue.messages.length).toBe(0);
    });

    it("does not remove other messages", async () => {
      const dialogueId = Math.random().toString(36).slice(2);
      const keepMsgId = Math.random().toString(36).slice(2);
      const deleteMsgId = Math.random().toString(36).slice(2);

      (messageApi.remove as jest.Mock).mockResolvedValueOnce({});

      const dialogue = new Dialogue(
        createMockDialogue({
          id: dialogueId,
          messages: [
            createMockMessage({ id: keepMsgId }),
            createMockMessage({ id: deleteMsgId }),
          ],
        })
      );

      await dialogue.deleteMessage(deleteMsgId);

      expect(dialogue.messages.length).toBe(1);
      expect(dialogue.messages[0].id).toBe(keepMsgId);
    });
  });

  describe("hasMoreMessages", () => {
    it("returns false initially", () => {
      const dialogue = new Dialogue(createMockDialogue());
      expect(dialogue.hasMoreMessages).toBe(false);
    });

    it("returns true when nextToken exists", async () => {
      (messagesApi.list as jest.Mock).mockResolvedValueOnce({
        items: [],
        next: "some-token",
      });

      const dialogue = new Dialogue(createMockDialogue());
      await dialogue.loadMessages();

      expect(dialogue.hasMoreMessages).toBe(true);
    });

    it("returns false when nextToken is cleared", async () => {
      (messagesApi.list as jest.Mock)
        .mockResolvedValueOnce({ items: [], next: "token" })
        .mockResolvedValueOnce({ items: [], next: undefined });

      const dialogue = new Dialogue(createMockDialogue());
      await dialogue.loadMessages();
      expect(dialogue.hasMoreMessages).toBe(true);

      await dialogue.loadMessages();
      expect(dialogue.hasMoreMessages).toBe(false);
    });
  });

  describe("createThread", () => {
    it("creates thread with parent reference", async () => {
      const parentId = Math.random().toString(36).slice(2);
      const threadId = Math.random().toString(36).slice(2);

      (dialogueApi.create as jest.Mock).mockResolvedValueOnce(
        createMockDialogue({ id: threadId })
      );

      const dialogue = new Dialogue(createMockDialogue({ id: parentId }));
      const thread = await dialogue.createThread();

      expect(dialogueApi.create).toHaveBeenCalledWith(
        expect.objectContaining({ threadOf: parentId }),
        expect.anything()
      );
      expect(thread).toBeInstanceOf(Dialogue);
      expect(thread.id).toBe(threadId);
    });

    it("passes metadata and tags to thread", async () => {
      const parentId = Math.random().toString(36).slice(2);

      (dialogueApi.create as jest.Mock).mockResolvedValueOnce(
        createMockDialogue()
      );

      const dialogue = new Dialogue(createMockDialogue({ id: parentId }));
      await dialogue.createThread({
        metadata: { topic: "billing" },
        tags: ["support"],
      });

      expect(dialogueApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          threadOf: parentId,
          metadata: { topic: "billing" },
          tags: ["support"],
        }),
        expect.anything()
      );
    });
  });

  describe("getThreads", () => {
    it("returns array of Dialogue instances", async () => {
      const parentId = Math.random().toString(36).slice(2);
      const thread1Id = Math.random().toString(36).slice(2);
      const thread2Id = Math.random().toString(36).slice(2);

      (dialogueApi.list as jest.Mock).mockResolvedValueOnce({
        items: [
          createMockDialogue({ id: thread1Id }),
          createMockDialogue({ id: thread2Id }),
        ],
      });

      const dialogue = new Dialogue(createMockDialogue({ id: parentId }));
      const threads = await dialogue.getThreads();

      expect(dialogueApi.list).toHaveBeenCalledWith(
        expect.objectContaining({
          threadOf: parentId,
        }),
        expect.anything()
      );
      expect(threads.length).toBe(2);
      expect(threads[0]).toBeInstanceOf(Dialogue);
      expect(threads[1]).toBeInstanceOf(Dialogue);
    });
  });

  describe("end()", () => {
    it("calls the end API and updates status to ended", async () => {
      const id = "dlg-end-test";
      const endedDialogue: IDialogue = {
        ...createMockDialogue({ id }),
        status: "ended",
        endedAt: "2025-01-15T12:00:00Z",
      };

      (dialogueApi.end as jest.Mock).mockResolvedValueOnce(endedDialogue);

      const dialogue = new Dialogue(createMockDialogue({ id }));
      expect(dialogue.status).toBe("active");

      await dialogue.end();

      expect(dialogueApi.end).toHaveBeenCalledWith({ id }, expect.anything());
      expect(dialogue.status).toBe("ended");
    });

    it("throws when API call fails", async () => {
      (dialogueApi.end as jest.Mock).mockRejectedValueOnce(
        new Error("Not found")
      );

      const dialogue = new Dialogue(createMockDialogue());

      await expect(dialogue.end()).rejects.toThrow("Not found");
      expect(dialogue.status).toBe("active");
    });
  });

  describe("unimplemented methods", () => {
    it("compact() throws not implemented error", async () => {
      const dialogue = new Dialogue(createMockDialogue());

      await expect(dialogue.compact()).rejects.toThrow(
        "compact() is not yet implemented"
      );
    });
  });

  describe("toJSON", () => {
    it("returns plain object representation", () => {
      const id = Math.random().toString(36).slice(2);
      const projectId = "test-project";
      const requestId = "test-request";
      const status = "active" as const;
      const namespace = "test-ns";
      const state = { step: 1 };
      const tags = ["tag1"];
      const metadata = { key: "value" };
      const created = "2024-01-01T00:00:00.000Z";
      const modified = "2024-01-02T00:00:00.000Z";

      const dialogue = new Dialogue(
        createMockDialogue({
          id,
          projectId,
          requestId,
          status,
          namespace,
          state,
          tags,
          metadata,
          created,
          modified,
        })
      );

      const json = dialogue.toJSON();

      expect(json).toEqual({
        id,
        projectId,
        requestId,
        status,
        namespace,
        state,
        tags,
        metadata,
        messages: [],
        created,
        modified,
      });
    });

    it("works with JSON.stringify", () => {
      const id = Math.random().toString(36).slice(2);
      const dialogue = new Dialogue(
        createMockDialogue({ id, state: { key: "value" } })
      );

      const jsonString = JSON.stringify(dialogue);
      const parsed = JSON.parse(jsonString);

      expect(parsed.id).toBe(id);
      expect(parsed.state).toEqual({ key: "value" });
    });

    it("includes messages in serialization", () => {
      const messageId = Math.random().toString(36).slice(2);
      const dialogue = new Dialogue(
        createMockDialogue({
          messages: [createMockMessage({ id: messageId, content: "Hello" })],
        })
      );

      const json = dialogue.toJSON();

      expect(json.messages.length).toBe(1);
      expect((json.messages[0] as any).id).toBe(messageId);
    });

    it("includes all optional fields in toJSON when present", () => {
      const dialogue = new Dialogue(
        createMockDialogue({
          threadOf: "parent-123",
          label: "Test",
          archivedAt: "2024-06-01T00:00:00.000Z",
          endedAt: "2024-05-01T00:00:00.000Z",
          totalMessages: 10,
          threadCount: 2,
          lastMessageCreated: "2024-07-01T00:00:00.000Z",
        })
      );

      const json = dialogue.toJSON();

      expect(json.threadOf).toBe("parent-123");
      expect(json.label).toBe("Test");
      expect(json.archivedAt).toBe("2024-06-01T00:00:00.000Z");
      expect(json.endedAt).toBe("2024-05-01T00:00:00.000Z");
      expect(json.totalMessages).toBe(10);
      expect(json.threadCount).toBe(2);
      expect(json.lastMessageCreated).toBe("2024-07-01T00:00:00.000Z");
    });

    it("toJSON returns copies - mutating result does not affect internal state", () => {
      const dialogue = new Dialogue(
        createMockDialogue({
          state: { key: "original" },
          metadata: { key: "original" },
          tags: ["original"],
          messages: [createMockMessage()],
        })
      );

      const json = dialogue.toJSON();

      // Mutate all the returned objects
      (json.state as any).key = "mutated";
      (json.metadata as any).key = "mutated";
      json.tags.push("mutated");
      json.messages.length = 0;

      // Internal state should be unchanged
      expect(dialogue.state).toEqual({ key: "original" });
      expect(dialogue.metadata).toEqual({ key: "original" });
      expect(dialogue.tags).toEqual(["original"]);
      expect(dialogue.messages.length).toBe(1);
    });

    it("inspect.custom returns same as toJSON", () => {
      const { inspect } = require("util");
      const dialogue = new Dialogue(
        createMockDialogue({ state: { test: true } })
      );

      const json = dialogue.toJSON();

      // The custom inspect symbol returns the same object as toJSON
      expect((dialogue as any)[inspect.custom]()).toEqual(json);
    });
  });

  describe("dark corners", () => {
    it("save with label change where server returns non-string label does not overwrite local", async () => {
      const id = Math.random().toString(36).slice(2);

      (dialogueApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockDialogue({ id }),
        label: null,
        state: {},
        tags: [],
        modified: new Date().toISOString(),
      });

      const dialogue = new Dialogue(createMockDialogue({ id }));
      dialogue.label = "My Label";
      await dialogue.save();

      // label should retain the local value since server returned non-string
      expect(dialogue.label).toBe("My Label");
    });

    it("partial save failure: message save fails but dialogue still attempted", async () => {
      const id = Math.random().toString(36).slice(2);
      const msg1Id = Math.random().toString(36).slice(2);
      const msg2Id = Math.random().toString(36).slice(2);

      (messageApi.update as jest.Mock)
        .mockRejectedValueOnce(new Error("Message save failed"))
        .mockResolvedValueOnce({
          ...createMockMessage({ id: msg2Id }),
          tags: ["saved"],
        });

      const dialogue = new Dialogue(
        createMockDialogue({
          id,
          messages: [
            createMockMessage({ id: msg1Id }),
            createMockMessage({ id: msg2Id }),
          ],
        })
      );

      dialogue.messages[0].tags = ["will-fail"];
      dialogue.messages[1].tags = ["will-succeed"];
      dialogue.state = { changed: true };

      // Promise.all rejects if any message save fails
      await expect(dialogue.save()).rejects.toThrow("Message save failed");

      // Dialogue API update was never called because message saves threw first
      expect(dialogueApi.update).not.toHaveBeenCalled();
    });

    it("loadMessages with next:true but no stored token does a fresh load (replaces)", async () => {
      const dialogueId = Math.random().toString(36).slice(2);
      const existingMsgId = Math.random().toString(36).slice(2);
      const loadedMsgId = Math.random().toString(36).slice(2);

      (messagesApi.list as jest.Mock).mockResolvedValueOnce({
        items: [createMockMessage({ id: loadedMsgId })],
        next: undefined,
      });

      const dialogue = new Dialogue(
        createMockDialogue({
          id: dialogueId,
          messages: [createMockMessage({ id: existingMsgId })],
        })
      );

      // next:true but no pagination token stored yet - should replace, not append
      await dialogue.loadMessages({ next: true });

      expect(dialogue.messages.length).toBe(1);
      expect(dialogue.messages[0].id).toBe(loadedMsgId);
    });

    it("concurrent loadMessages with pagination can cause duplicates", async () => {
      const dialogueId = Math.random().toString(36).slice(2);
      const page1Msg = createMockMessage({ id: "page1-msg" });
      const page2MsgA = createMockMessage({ id: "page2-msg-a" });
      const page2MsgB = createMockMessage({ id: "page2-msg-b" });

      // First load returns page1 with a next token
      (messagesApi.list as jest.Mock).mockResolvedValueOnce({
        items: [page1Msg],
        next: "token-page2",
      });

      const dialogue = new Dialogue(createMockDialogue({ id: dialogueId }));
      await dialogue.loadMessages();

      expect(dialogue.messages.length).toBe(1);

      // Both concurrent calls read the same token
      (messagesApi.list as jest.Mock)
        .mockResolvedValueOnce({
          items: [page2MsgA],
          next: undefined,
        })
        .mockResolvedValueOnce({
          items: [page2MsgB],
          next: undefined,
        });

      // Fire two pagination calls concurrently - both use the same token
      const [loaded1, loaded2] = await Promise.all([
        dialogue.loadMessages({ next: true }),
        dialogue.loadMessages({ next: true }),
      ]);

      // Both calls append, leading to duplicated page results
      expect(dialogue.messages.length).toBe(3);
      expect(loaded1.length).toBe(1);
      expect(loaded2.length).toBe(1);
    });

    it("toJSON messages are Message instances (have toJSON method)", () => {
      const dialogue = new Dialogue(
        createMockDialogue({
          messages: [createMockMessage({ content: "Hello" })],
        })
      );

      const json = dialogue.toJSON();

      // Messages in toJSON are spread copies of Message instances
      // JSON.stringify still works because Message has toJSON()
      const stringified = JSON.stringify(json);
      const parsed = JSON.parse(stringified);

      expect(parsed.messages.length).toBe(1);
      expect(parsed.messages[0].content).toBe("Hello");
      expect(parsed.messages[0]).toHaveProperty("id");
      expect(parsed.messages[0]).toHaveProperty("role");
    });

    it("save only dirty messages, not all messages", async () => {
      const id = Math.random().toString(36).slice(2);
      const cleanMsgId = Math.random().toString(36).slice(2);
      const dirtyMsgId = Math.random().toString(36).slice(2);

      (messageApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockMessage({ id: dirtyMsgId }),
        tags: ["updated"],
      });

      (dialogueApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockDialogue({ id }),
        state: { changed: true },
        tags: [],
        modified: new Date().toISOString(),
      });

      const dialogue = new Dialogue(
        createMockDialogue({
          id,
          messages: [
            createMockMessage({ id: cleanMsgId }),
            createMockMessage({ id: dirtyMsgId }),
          ],
        })
      );

      dialogue.messages[1].tags = ["updated"];
      dialogue.state = { changed: true };

      await dialogue.save();

      // Only the dirty message should trigger an API call
      expect(messageApi.update).toHaveBeenCalledTimes(1);
      expect(messageApi.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: dirtyMsgId }),
        expect.anything()
      );
    });
  });

  describe("messages initialization", () => {
    it("creates Message instances from constructor data", () => {
      const msgId = Math.random().toString(36).slice(2);
      const dialogue = new Dialogue(
        createMockDialogue({
          messages: [createMockMessage({ id: msgId, content: "Test" })],
        })
      );

      expect(dialogue.messages.length).toBe(1);
      expect(dialogue.messages[0].id).toBe(msgId);
      expect(dialogue.messages[0].content).toBe("Test");
    });

    it("messages have working onRemoved callback", async () => {
      const msgId = Math.random().toString(36).slice(2);

      (messageApi.remove as jest.Mock).mockResolvedValueOnce({});

      const dialogue = new Dialogue(
        createMockDialogue({
          messages: [createMockMessage({ id: msgId })],
        })
      );

      await dialogue.messages[0].remove();

      expect(dialogue.messages.length).toBe(0);
    });
  });
});
