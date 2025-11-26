import { Memory } from "./class.memory";
import * as memoryApi from "@/api/memory";
import { IMemory } from "@/types";

jest.mock("@/api/memory", () => ({
  update: jest.fn(),
  remove: jest.fn(),
}));

function createMockMemory(overrides: Partial<IMemory> = {}): IMemory {
  return {
    key: Math.random().toString(36).slice(2),
    value: "test value",
    type: "string",
    metadata: {},
    tags: [],
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    ...overrides,
  };
}

describe("Memory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor validation", () => {
    it("creates memory with valid data", () => {
      const key = "test-key";
      const memory = new Memory(createMockMemory({ key }));

      expect(memory.key).toBe(key);
      expect(memory.type).toBe("string");
      expect(memory.isDirty).toBe(false);
    });

    it("throws when key is missing", () => {
      expect(() => {
        new Memory({ ...createMockMemory(), key: undefined as any });
      }).toThrow("Invalid key: is required and must be a string");
    });

    it("throws when key is empty string", () => {
      expect(() => {
        new Memory({ ...createMockMemory(), key: "" });
      }).toThrow("Invalid key: is required and must be a string");
    });

    it("throws when key is not a string", () => {
      expect(() => {
        new Memory({ ...createMockMemory(), key: 123 as any });
      }).toThrow("Invalid key: is required and must be a string");
    });

    it("throws when memory object is null", () => {
      expect(() => {
        new Memory(null as any);
      }).toThrow("Invalid key: is required and must be a string");
    });

    it("throws when memory object is undefined", () => {
      expect(() => {
        new Memory(undefined as any);
      }).toThrow("Invalid key: is required and must be a string");
    });

    it("throws when type is missing", () => {
      expect(() => {
        new Memory({ ...createMockMemory(), type: undefined as any });
      }).toThrow("Invalid type: is required and must be one of");
    });

    it("throws when type is invalid", () => {
      expect(() => {
        new Memory({ ...createMockMemory(), type: "invalid" as any });
      }).toThrow("Invalid type: is required and must be one of");
    });

    it("accepts all valid types", () => {
      const validTypes: IMemory["type"][] = ["string", "object", "array", "boolean", "number"];

      for (const type of validTypes) {
        const value = type === "object" ? {} : type === "array" ? [] : type === "boolean" ? true : type === "number" ? 42 : "str";
        const memory = new Memory(createMockMemory({ type, value }));
        expect(memory.type).toBe(type);
      }
    });

    it("throws when value is missing", () => {
      expect(() => {
        new Memory({ ...createMockMemory(), value: undefined as any });
      }).toThrow("value is required");
    });

    it("throws when tags contains non-strings", () => {
      expect(() => {
        new Memory(createMockMemory({ tags: ["valid", 123 as any] }));
      }).toThrow("Invalid tags: must be array of strings");
    });

    it("accepts optional namespace", () => {
      const memory = new Memory(createMockMemory({ namespace: "my-ns" }));
      expect(memory.namespace).toBe("my-ns");
    });

    it("accepts optional label", () => {
      const memory = new Memory(createMockMemory({ label: "My Label" }));
      expect(memory.label).toBe("My Label");
    });

    it("accepts optional description", () => {
      const memory = new Memory(createMockMemory({ description: "My description" }));
      expect(memory.description).toBe("My description");
    });

    it("generates timestamps when not provided", () => {
      const mem = createMockMemory();
      delete (mem as any).created;
      delete (mem as any).modified;

      const memory = new Memory(mem);

      expect(memory.created).toBeDefined();
      expect(memory.modified).toBeDefined();
    });
  });

  describe("mutation isolation", () => {
    it("deep clones object value from constructor input", () => {
      const originalValue = { nested: { data: "original" } };
      const memory = new Memory(
        createMockMemory({ value: originalValue, type: "object" })
      );

      originalValue.nested.data = "mutated";

      expect((memory.value as any).nested.data).toBe("original");
    });

    it("deep clones array value from constructor input", () => {
      const originalValue = [{ item: "original" }];
      const memory = new Memory(
        createMockMemory({ value: originalValue, type: "array" })
      );

      originalValue[0].item = "mutated";
      originalValue.push({ item: "new" });

      expect((memory.value as any)[0].item).toBe("original");
      expect((memory.value as any).length).toBe(1);
    });

    it("deep clones metadata from constructor input", () => {
      const originalMetadata = { key: "original" };
      const memory = new Memory(
        createMockMemory({ metadata: originalMetadata })
      );

      originalMetadata.key = "mutated";

      expect(memory.metadata.key).toBe("original");
    });

    it("metadata getter returns copy to prevent mutation", () => {
      const memory = new Memory(
        createMockMemory({ metadata: { key: "value" } })
      );

      const retrieved = memory.metadata;
      (retrieved as any).key = "mutated";

      expect(memory.metadata.key).toBe("value");
    });

    it("copies tags array from constructor", () => {
      const originalTags = ["tag1", "tag2"];
      const memory = new Memory(createMockMemory({ tags: originalTags }));

      originalTags.push("tag3");

      expect(memory.tags).toEqual(["tag1", "tag2"]);
    });

    // BUG TEST: tags getter returns direct reference
    it("tags getter returns clone - external mutation does not affect internal tags", () => {
      const memory = new Memory(createMockMemory({ tags: ["original"] }));

      const retrieved = memory.tags;
      retrieved.push("sneaky");

      // This SHOULD pass if tags getter returns a copy
      expect(memory.tags).toEqual(["original"]);
      expect(memory.tags).not.toContain("sneaky");
      expect(memory.isDirty).toBe(false);
    });

    // BUG TEST: value getter returns shallow copy for nested objects
    it("value getter returns deep clone - nested mutation does not affect internal value", () => {
      const memory = new Memory(
        createMockMemory({ value: { nested: { deep: "original" } }, type: "object" })
      );

      const retrieved = memory.value as any;
      retrieved.nested.deep = "mutated";

      // This SHOULD pass if value getter returns a deep copy
      expect((memory.value as any).nested.deep).toBe("original");
    });

    it("value getter returns copy of array - mutation does not affect internal value", () => {
      const memory = new Memory(
        createMockMemory({ value: ["a", "b"], type: "array" })
      );

      const retrieved = memory.value as any[];
      retrieved.push("c");

      expect(memory.value).toEqual(["a", "b"]);
    });

    it("primitive values are safe from mutation", () => {
      const memory = new Memory(createMockMemory({ value: "test", type: "string" }));
      expect(memory.value).toBe("test");

      const numMemory = new Memory(createMockMemory({ value: 42, type: "number" }));
      expect(numMemory.value).toBe(42);

      const boolMemory = new Memory(createMockMemory({ value: true, type: "boolean" }));
      expect(boolMemory.value).toBe(true);
    });
  });

  describe("tags management", () => {
    it("setting tags marks memory as dirty", () => {
      const memory = new Memory(createMockMemory());

      expect(memory.isDirty).toBe(false);
      memory.tags = ["new-tag"];
      expect(memory.isDirty).toBe(true);
    });

    it("throws when tags is not an array", () => {
      const memory = new Memory(createMockMemory());

      expect(() => {
        memory.tags = "not-an-array" as any;
      }).toThrow("Invalid tags: must be an array");
    });

    it("throws when tags contains non-strings", () => {
      const memory = new Memory(createMockMemory());

      expect(() => {
        memory.tags = ["valid", 123 as any];
      }).toThrow("Invalid tags: must be array of strings");
    });

    it("saveTags sets tags and calls save", async () => {
      const key = "test-key";
      const newTags = ["important"];

      (memoryApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockMemory({ key }),
        tags: newTags,
        modified: new Date().toISOString(),
      });

      const memory = new Memory(createMockMemory({ key }));
      await memory.saveTags(newTags);

      expect(memoryApi.update).toHaveBeenCalledWith(
        expect.objectContaining({ key, tags: newTags }),
        expect.anything()
      );
      expect(memory.tags).toEqual(newTags);
      expect(memory.isDirty).toBe(false);
    });
  });

  describe("save", () => {
    it("does not call API when not dirty", async () => {
      const memory = new Memory(createMockMemory());

      await memory.save();

      expect(memoryApi.update).not.toHaveBeenCalled();
    });

    it("calls API and clears dirty flag when dirty", async () => {
      const key = "test-key";

      (memoryApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockMemory({ key }),
        tags: ["updated"],
        modified: new Date().toISOString(),
      });

      const memory = new Memory(createMockMemory({ key }));
      memory.tags = ["updated"];

      expect(memory.isDirty).toBe(true);
      await memory.save();
      expect(memory.isDirty).toBe(false);
    });

    it("syncs tags from server response after save", async () => {
      const key = "test-key";
      const serverTags = ["tag1", "server-added"];

      (memoryApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockMemory({ key }),
        tags: serverTags,
        modified: new Date().toISOString(),
      });

      const memory = new Memory(createMockMemory({ key }));
      memory.tags = ["tag1"];
      await memory.save();

      expect(memory.tags).toEqual(serverTags);
    });

    it("updates modified timestamp from server response", async () => {
      const key = "test-key";
      const originalModified = "2024-01-01T00:00:00.000Z";
      const updatedModified = "2024-06-15T12:00:00.000Z";

      (memoryApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockMemory({ key }),
        tags: ["tag"],
        modified: updatedModified,
      });

      const memory = new Memory(createMockMemory({ key, modified: originalModified }));
      memory.tags = ["tag"];
      await memory.save();

      expect(memory.modified).toBe(updatedModified);
    });

    it("handles server response with undefined tags", async () => {
      const key = "test-key";

      (memoryApi.update as jest.Mock).mockResolvedValueOnce({
        ...createMockMemory({ key }),
        tags: undefined,
        modified: new Date().toISOString(),
      });

      const memory = new Memory(createMockMemory({ key }));
      memory.tags = ["tag1"];
      await memory.save();

      expect(memory.tags).toEqual([]);
    });
  });

  describe("remove", () => {
    it("calls API remove with key", async () => {
      const key = "test-key";

      (memoryApi.remove as jest.Mock).mockResolvedValueOnce({});

      const memory = new Memory(createMockMemory({ key }));
      await memory.remove();

      expect(memoryApi.remove).toHaveBeenCalledWith({ key }, expect.anything());
    });

    it("calls onRemoved callback after API remove", async () => {
      const key = "test-key";
      const onRemoved = jest.fn();

      (memoryApi.remove as jest.Mock).mockResolvedValueOnce({});

      const memory = new Memory(createMockMemory({ key }), undefined, {
        onRemoved,
      });
      await memory.remove();

      expect(onRemoved).toHaveBeenCalled();
    });
  });

  describe("toJSON", () => {
    it("returns plain object representation", () => {
      const key = "test-key";
      const namespace = "my-ns";
      const label = "My Label";
      const description = "My description";
      const value = { data: "test" };
      const type = "object" as const;
      const metadata = { source: "test" };
      const tags = ["tag1"];
      const created = "2024-01-01T00:00:00.000Z";
      const modified = "2024-01-02T00:00:00.000Z";

      const memory = new Memory(
        createMockMemory({
          key,
          namespace,
          label,
          description,
          value,
          type,
          metadata,
          tags,
          created,
          modified,
        })
      );

      const json = memory.toJSON();

      expect(json).toEqual({
        key,
        namespace,
        label,
        description,
        value,
        type,
        metadata,
        tags,
        created,
        modified,
      });
    });

    it("works with JSON.stringify", () => {
      const key = "test-key";
      const memory = new Memory(createMockMemory({ key, value: "test" }));

      const jsonString = JSON.stringify(memory);
      const parsed = JSON.parse(jsonString);

      expect(parsed.key).toBe(key);
      expect(parsed.value).toBe("test");
    });

    it("inspect.custom returns same as toJSON", () => {
      const { inspect } = require("util");
      const memory = new Memory(createMockMemory({ value: "test" }));

      const json = memory.toJSON();
      expect((memory as any)[inspect.custom]()).toEqual(json);
    });
  });
});
