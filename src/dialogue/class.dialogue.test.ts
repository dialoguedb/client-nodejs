import { ulid } from "ulid";
import { Dialogue } from "./class.dialogue";
import * as dialogueApi from "@/api/dialogue";
import * as messageApi from "@/api/message";
import * as messagesApi from "@/api/messages";
import { IDialogue, IMessage } from "@/types";

jest.mock("@/api/dialogue", () => ({
  update: jest.fn(),
  create: jest.fn(),
  list: jest.fn(),
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
    id: ulid(),
    expired: false,
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
    id: ulid(),
    dialogueId: "test-dialogue",
    role: "user",
    content: "test content",
    namespace: "test",
    metadata: {},
    tags: [],
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    ...overrides,
  };
}

describe("Dialogue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  describe("constructor validation", () => {
    it("creates dialogue with valid data", () => {
      const id = ulid();
      const dialogue = new Dialogue(createMockDialogue({ id }));

      expect(dialogue.id).toBe(id);
      expect(dialogue.messages).toEqual([]);
      expect(dialogue.state).toEqual({});
      expect(dialogue.tags).toEqual([]);
      expect(dialogue.isDirty).toBe(false);
    });

    it("throws when id is missing", () => {
      expect(() => {
        new Dialogue({ ...createMockDialogue(), id: undefined as any });
      }).toThrow("Dialogue id is required and must be a string");
    });

    it("throws when id is not a string", () => {
      expect(() => {
        new Dialogue({ ...createMockDialogue(), id: 123 as any });
      }).toThrow("Dialogue id is required and must be a string");
    });

    it("throws when id is empty string", () => {
      expect(() => {
        new Dialogue({ ...createMockDialogue(), id: "" });
      }).toThrow("Dialogue id is required and must be a string");
    });

    it("throws when tags contains non-strings", () => {
      expect(() => {
        new Dialogue(createMockDialogue({ tags: ["valid", 123 as any] }));
      }).toThrow("tags must be array of strings");
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
      const dialogue = new Dialogue(
        createMockDialogue({ tags: ["original"] })
      );

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

    it("saveState sets state and calls save", async () => {
      const id = ulid();
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


  describe("tags management", () => {
    it("setting tags marks dialogue as dirty", () => {
      const dialogue = new Dialogue(createMockDialogue());

      expect(dialogue.isDirty).toBe(false);
      dialogue.tags = ["new-tag"];
      expect(dialogue.isDirty).toBe(true);
    });

    it("saveTags sets tags and calls save", async () => {
      const id = ulid();
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
      const id = ulid();
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
      const id = ulid();
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
      const id = ulid();
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

    it("updates modified timestamp from server response", async () => {
      const id = ulid();
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
      const id = ulid();
      const messageId = ulid();

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
      const id = ulid();

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
      const id = ulid();

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
      const id = ulid();

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
      const dialogueId = ulid();
      const messageId = ulid();
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
      const dialogueId = ulid();
      const messageId = ulid();

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
      const dialogueId = ulid();
      const msg1Id = ulid();
      const msg2Id = ulid();

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
      const dialogueId = ulid();
      const existingMsgId = ulid();
      const loadedMsgId = ulid();

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
      const dialogueId = ulid();
      const existingMsgId = ulid();
      const loadedMsgId = ulid();

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
      const dialogueId = ulid();
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
      const dialogueId = ulid();
      const msgId = ulid();

      (messagesApi.list as jest.Mock).mockResolvedValueOnce({
        items: [createMockMessage({ id: msgId })],
        next: undefined,
      });

      const dialogue = new Dialogue(createMockDialogue({ id: dialogueId }));
      const loaded = await dialogue.loadMessages();

      expect(loaded.length).toBe(1);
      expect(loaded[0].id).toBe(msgId);
    });
  });

  describe("deleteMessage", () => {
    it("calls API and removes from local array", async () => {
      const dialogueId = ulid();
      const messageId = ulid();

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
      const dialogueId = ulid();
      const keepMsgId = ulid();
      const deleteMsgId = ulid();

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
      const parentId = ulid();
      const threadId = ulid();

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
      const parentId = ulid();

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
      const parentId = ulid();
      const thread1Id = ulid();
      const thread2Id = ulid();

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


  describe("unimplemented methods", () => {
    it("end() throws not implemented error", async () => {
      const dialogue = new Dialogue(createMockDialogue());

      await expect(dialogue.end()).rejects.toThrow(
        "end() action not yet implemented"
      );
    });

    it("compact() throws not implemented error", async () => {
      const dialogue = new Dialogue(createMockDialogue());

      await expect(dialogue.compact()).rejects.toThrow(
        "compact() action not yet implemented"
      );
    });
  });


  describe("toJSON", () => {
    it("returns plain object representation", () => {
      const id = ulid();
      const namespace = "test-ns";
      const state = { step: 1 };
      const tags = ["tag1"];
      const metadata = { key: "value" };
      const created = "2024-01-01T00:00:00.000Z";
      const modified = "2024-01-02T00:00:00.000Z";

      const dialogue = new Dialogue(
        createMockDialogue({
          id,
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
      const id = ulid();
      const dialogue = new Dialogue(
        createMockDialogue({ id, state: { key: "value" } })
      );

      const jsonString = JSON.stringify(dialogue);
      const parsed = JSON.parse(jsonString);

      expect(parsed.id).toBe(id);
      expect(parsed.state).toEqual({ key: "value" });
    });

    it("includes messages in serialization", () => {
      const messageId = ulid();
      const dialogue = new Dialogue(
        createMockDialogue({
          messages: [createMockMessage({ id: messageId, content: "Hello" })],
        })
      );

      const json = dialogue.toJSON();

      expect(json.messages.length).toBe(1);
      expect((json.messages[0] as any).id).toBe(messageId);
    });
  });


  describe("messages initialization", () => {
    it("creates Message instances from constructor data", () => {
      const msgId = ulid();
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
      const msgId = ulid();

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
