import { Message } from "./class.message";
import * as messageApi from "@/api/message";
import { IMessage } from "@/types";

jest.mock("@/api/message", () => ({
  update: jest.fn(),
  remove: jest.fn(),
}));

function createMockMessage(overrides: Partial<IMessage> = {}): IMessage {
  return {
    id:Math.random().toString(36).slice(2),
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

describe("Message", () => {
  const dialogueId = Math.random().toString(36).slice(2);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor validation", () => {
    it("creates message with valid data", () => {
      const id = Math.random().toString(36).slice(2);;
      const message = new Message(dialogueId, createMockMessage({ id }));

      expect(message.id).toBe(id);
      expect(message.role).toBe("user");
      expect(message.isDirty).toBe(false);
    });

    it("throws when dialogueId is missing", () => {
      expect(() => {
        new Message("", createMockMessage());
      }).toThrow("Message dialogueId is required and must be a string");
    });

    it("throws when dialogueId is not a string", () => {
      expect(() => {
        new Message(123 as any, createMockMessage());
      }).toThrow("Message dialogueId is required and must be a string");
    });

    it("throws when message id is missing", () => {
      expect(() => {
        new Message(dialogueId, { ...createMockMessage(), id: undefined as any });
      }).toThrow("Message id is required and must be a string");
    });

    it("throws when message id is empty string", () => {
      expect(() => {
        new Message(dialogueId, { ...createMockMessage(), id: "" });
      }).toThrow("Message id is required and must be a string");
    });

    it("throws when role is missing", () => {
      expect(() => {
        new Message(dialogueId, { ...createMockMessage(), role: undefined as any });
      }).toThrow("Message role is required and must be a string");
    });

    it("throws when role is not a string", () => {
      expect(() => {
        new Message(dialogueId, { ...createMockMessage(), role: 123 as any });
      }).toThrow("Message role is required and must be a string");
    });

    it("throws when tags contains non-strings", () => {
      expect(() => {
        new Message(dialogueId, createMockMessage({ tags: ["valid", 123 as any] }));
      }).toThrow("tags must be array of strings");
    });

    it("defaults content to empty string when missing", () => {
      const msg = createMockMessage();
      delete (msg as any).content;
      const message = new Message(dialogueId, msg);
      expect(message.content).toBe("");
    });

    it("generates timestamps when not provided", () => {
      const msg = createMockMessage();
      delete (msg as any).created;
      delete (msg as any).modified;

      const message = new Message(dialogueId, msg);

      expect(message.created).toBeDefined();
      expect(message.modified).toBeDefined();
    });
  });

  describe("mutation isolation", () => {
    it("deep clones metadata from constructor input", () => {
      const originalMetadata = { key: "original" };
      const message = new Message(
        dialogueId,
        createMockMessage({ metadata: originalMetadata })
      );

      originalMetadata.key = "mutated";

      expect(message.metadata.key).toBe("original");
    });

    it("metadata getter returns copy to prevent mutation", () => {
      const message = new Message(
        dialogueId,
        createMockMessage({ metadata: { key: "value" } })
      );

      const retrieved = message.metadata;
      (retrieved as any).key = "mutated";

      expect(message.metadata.key).toBe("value");
    });

    it("copies tags array from constructor", () => {
      const originalTags = ["tag1", "tag2"];
      const message = new Message(
        dialogueId,
        createMockMessage({ tags: originalTags })
      );

      originalTags.push("tag3");

      expect(message.tags).toEqual(["tag1", "tag2"]);
    });

    // BUG TEST: tags getter returns direct reference
    it("tags getter returns clone - external mutation does not affect internal tags", () => {
      const message = new Message(
        dialogueId,
        createMockMessage({ tags: ["original"] })
      );

      const retrieved = message.tags;
      retrieved.push("sneaky");

      // This SHOULD pass if tags getter returns a copy
      expect(message.tags).toEqual(["original"]);
      expect(message.tags).not.toContain("sneaky");
      expect(message.isDirty).toBe(false);
    });
  });

  describe("tags management", () => {
    it("setting tags marks message as dirty", () => {
      const message = new Message(dialogueId, createMockMessage());

      expect(message.isDirty).toBe(false);
      message.tags = ["new-tag"];
      expect(message.isDirty).toBe(true);
    });

    it("saveTags sets tags and calls save", async () => {
      const id = Math.random().toString(36).slice(2);
      const newTags = ["important"];

      (messageApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockMessage({ id }),
        tags: newTags,
        modified: new Date().toISOString(),
      });

      const message = new Message(dialogueId, createMockMessage({ id }));
      await message.saveTags(newTags);

      expect(messageApi.update).toHaveBeenCalledWith(
        expect.objectContaining({ id, dialogueId, tags: newTags }),
        expect.anything()
      );
      expect(message.tags).toEqual(newTags);
      expect(message.isDirty).toBe(false);
    });
  });

  describe("save", () => {
    it("does not call API when not dirty", async () => {
      const message = new Message(dialogueId, createMockMessage());

      await message.save();

      expect(messageApi.update).not.toHaveBeenCalled();
    });

    it("calls API and clears dirty flag when dirty", async () => {
      const id = Math.random().toString(36).slice(2);

      (messageApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockMessage({ id }),
        tags: ["updated"],
        modified: new Date().toISOString(),
      });

      const message = new Message(dialogueId, createMockMessage({ id }));
      message.tags = ["updated"];

      expect(message.isDirty).toBe(true);
      await message.save();
      expect(message.isDirty).toBe(false);
    });

    it("syncs tags from server response after save", async () => {
      const id = Math.random().toString(36).slice(2);
      const serverTags = ["tag1", "server-added"];

      (messageApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockMessage({ id }),
        tags: serverTags,
        modified: new Date().toISOString(),
      });

      const message = new Message(dialogueId, createMockMessage({ id }));
      message.tags = ["tag1"];
      await message.save();

      expect(message.tags).toEqual(serverTags);
    });

    it("updates modified timestamp from server response", async () => {
      const id = Math.random().toString(36).slice(2);
      const originalModified = "2024-01-01T00:00:00.000Z";
      const updatedModified = "2024-06-15T12:00:00.000Z";

      (messageApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockMessage({ id }),
        tags: ["tag"],
        modified: updatedModified,
      });

      const message = new Message(
        dialogueId,
        createMockMessage({ id, modified: originalModified })
      );
      message.tags = ["tag"];
      await message.save();

      expect(message.modified).toBe(updatedModified);
    });
  });

  describe("remove", () => {
    it("calls API remove", async () => {
      const id = Math.random().toString(36).slice(2);

      (messageApi.remove as jest.Mock).mockResolvedValueOnce({});

      const message = new Message(dialogueId, createMockMessage({ id }));
      await message.remove();

      expect(messageApi.remove).toHaveBeenCalledWith(
        { dialogueId, id },
        expect.anything()
      );
    });

    it("calls onRemoved callback after API remove", async () => {
      const id = Math.random().toString(36).slice(2);
      const onRemoved = jest.fn();

      (messageApi.remove as jest.Mock).mockResolvedValueOnce({});

      const message = new Message(dialogueId, createMockMessage({ id }), undefined, {
        onRemoved,
      });
      await message.remove();

      expect(onRemoved).toHaveBeenCalled();
    });

    it("does not fail if onRemoved is not provided", async () => {
      const id = Math.random().toString(36).slice(2);

      (messageApi.remove as jest.Mock).mockResolvedValueOnce({});

      const message = new Message(dialogueId, createMockMessage({ id }));

      await expect(message.remove()).resolves.toBeUndefined();
    });
  });

  describe("toJSON", () => {
    it("returns plain object representation", () => {
      const id = Math.random().toString(36).slice(2);
      const role = "assistant";
      const content = "Hello there";
      const metadata = { key: "value" };
      const tags = ["tag1"];
      const created = "2024-01-01T00:00:00.000Z";
      const modified = "2024-01-02T00:00:00.000Z";

      const message = new Message(
        dialogueId,
        createMockMessage({ id, role, content, metadata, tags, created, modified })
      );

      const json = message.toJSON();

      expect(json).toEqual({
        id,
        role,
        content,
        metadata,
        tags,
        created,
        modified,
      });
    });

    it("works with JSON.stringify", () => {
      const id = Math.random().toString(36).slice(2);
      const message = new Message(
        dialogueId,
        createMockMessage({ id, content: "test" })
      );

      const jsonString = JSON.stringify(message);
      const parsed = JSON.parse(jsonString);

      expect(parsed.id).toBe(id);
      expect(parsed.content).toBe("test");
    });
  });

  describe("readonly properties", () => {
    it("id is readonly", () => {
      const message = new Message(dialogueId, createMockMessage());
      expect(() => {
        (message as any).id = "new-id";
      }).toThrow();
    });

    it("role is readonly", () => {
      const message = new Message(dialogueId, createMockMessage());
      expect(() => {
        (message as any).role = "new-role";
      }).toThrow();
    });

    it("content is readonly", () => {
      const message = new Message(dialogueId, createMockMessage());
      expect(() => {
        (message as any).content = "new-content";
      }).toThrow();
    });
  });
});
