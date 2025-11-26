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
      key: "my-key",
      value: "my string value",
    };
    const mockResponse = {
      key: "my-key",
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
    expect(memory.key).toBe("my-key");
    expect(memory.value).toBe("my string value");
    expect(memory.type).toBe("string");
  });

  it("should create memory with number value", async () => {
    const input = {
      key: "num-key",
      value: 42,
    };
    const mockResponse = {
      key: "num-key",
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
      key: "bool-key",
      value: false,
    };
    const mockResponse = {
      key: "bool-key",
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
      key: "obj-key",
      value: { nested: { data: [1, 2, 3] } },
    };
    const mockResponse = {
      key: "obj-key",
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
      key: "arr-key",
      value: [{ id: 1 }, { id: 2 }],
    };
    const mockResponse = {
      key: "arr-key",
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
      key: "full-key",
      value: "test",
      namespace: "my-namespace",
      label: "My Label",
      description: "A helpful description",
      tags: ["tag1", "tag2"],
      metadata: { priority: 5, active: true },
    };
    const mockResponse = {
      key: "full-key",
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
    expect(memory.key).toBe("full-key");
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

    const input = { key: "test", value: "data" };
    const mockResponse = {
      key: "test",
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

  it("should create memory without explicit key (server generates)", async () => {
    const input = {
      value: "auto-keyed value",
    };
    const mockResponse = {
      key: "server-generated-key-123",
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
    expect(memory.key).toBe("server-generated-key-123");
  });
});
