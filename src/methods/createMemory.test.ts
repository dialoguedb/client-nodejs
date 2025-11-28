import { create } from "@/api/memory";
import { createMemory } from "./createMemory";
import { Memory } from "@/dialogue/class.memory";
import { SettingsContainer } from "@/settings/class.SettingsContainer";

jest.mock("@/api/memory", () => ({
  create: jest.fn(),
}));

describe("createMemory", () => {
  const apiCreateMock = create as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create memory with string value", async () => {
    const input = {
      id: "my-key",
      value: "my string value",
    };
    const mockResponse = {
      id: "my-key",
      value: "my string value",
      type: "string",
      tags: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      metadata: {},
    };

    apiCreateMock.mockResolvedValueOnce(mockResponse);

    const memory = await createMemory(input);

    expect(apiCreateMock).toHaveBeenCalledTimes(1);
    expect(apiCreateMock).toHaveBeenCalledWith(input, expect.anything());
    expect(memory).toBeInstanceOf(Memory);
    expect(memory.id).toBe("my-key");
    expect(memory.value).toBe("my string value");
    expect(memory.type).toBe("string");
  });

  it("should create memory with number value", async () => {
    const input = {
      id: "num-key",
      value: 42,
    };
    const mockResponse = {
      id: "num-key",
      value: 42,
      type: "number",
      tags: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      metadata: {},
    };

    apiCreateMock.mockResolvedValueOnce(mockResponse);

    const memory = await createMemory(input);

    expect(memory.value).toBe(42);
    expect(memory.type).toBe("number");
  });

  it("should create memory with boolean value", async () => {
    const input = {
      id: "bool-key",
      value: false,
    };
    const mockResponse = {
      id: "bool-key",
      value: false,
      type: "boolean",
      tags: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      metadata: {},
    };

    apiCreateMock.mockResolvedValueOnce(mockResponse);

    const memory = await createMemory(input);

    expect(memory.value).toBe(false);
    expect(memory.type).toBe("boolean");
  });

  it("should create memory with object value", async () => {
    const input = {
      id: "obj-key",
      value: { nested: { data: [1, 2, 3] } },
    };
    const mockResponse = {
      id: "obj-key",
      value: { nested: { data: [1, 2, 3] } },
      type: "object",
      tags: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      metadata: {},
    };

    apiCreateMock.mockResolvedValueOnce(mockResponse);

    const memory = await createMemory(input);

    expect(memory.value).toEqual({ nested: { data: [1, 2, 3] } });
    expect(memory.type).toBe("object");
  });

  it("should create memory with array value", async () => {
    const input = {
      id: "arr-key",
      value: [{ id: 1 }, { id: 2 }],
    };
    const mockResponse = {
      id: "arr-key",
      value: [{ id: 1 }, { id: 2 }],
      type: "array",
      tags: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      metadata: {},
    };

    apiCreateMock.mockResolvedValueOnce(mockResponse);

    const memory = await createMemory(input);

    expect(memory.value).toEqual([{ id: 1 }, { id: 2 }]);
    expect(memory.type).toBe("array");
  });

  it("should create memory with all optional fields", async () => {
    const input = {
      id: "full-key",
      value: "test",
      namespace: "my-namespace",
      label: "My Label",
      description: "A helpful description",
      tags: ["tag1", "tag2"],
      metadata: { priority: 5, active: true },
    };
    const mockResponse = {
      id: "full-key",
      value: "test",
      type: "string",
      namespace: "my-namespace",
      label: "My Label",
      description: "A helpful description",
      tags: ["tag1", "tag2"],
      metadata: { priority: 5, active: true },
      created: "2024-01-01T00:00:00.000Z",
      modified: "2024-01-01T00:00:00.000Z",
    };

    apiCreateMock.mockResolvedValueOnce(mockResponse);

    const memory = await createMemory(input);

    expect(apiCreateMock).toHaveBeenCalledWith(input, expect.anything());
    expect(memory.id).toBe("full-key");
    expect(memory.namespace).toBe("my-namespace");
    expect(memory.label).toBe("My Label");
    expect(memory.description).toBe("A helpful description");
    expect(memory.tags).toEqual(["tag1", "tag2"]);
    expect(memory.metadata).toEqual({ priority: 5, active: true });
  });

  it("should use provided settings", async () => {
    const settings = new SettingsContainer();
    settings.set("apiKey", "custom-key");
    settings.set("endpoint", "https://custom.api.com");

    const input = { id: "test", value: "data" };
    const mockResponse = {
      id: "test",
      value: "data",
      type: "string",
      tags: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      metadata: {},
    };

    apiCreateMock.mockResolvedValueOnce(mockResponse);

    await createMemory(input, settings);

    expect(apiCreateMock).toHaveBeenCalledWith(input, settings);
  });

  it("should create memory without explicit id (server generates)", async () => {
    const input = {
      value: "auto-keyed value",
    };
    const mockResponse = {
      id: "server-generated-key-123",
      value: "auto-keyed value",
      type: "string",
      tags: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      metadata: {},
    };

    apiCreateMock.mockResolvedValueOnce(mockResponse);

    const memory = await createMemory(input);

    expect(apiCreateMock).toHaveBeenCalledWith(input, expect.anything());
    expect(memory.id).toBe("server-generated-key-123");
  });
});
