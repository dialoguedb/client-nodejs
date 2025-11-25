import { get } from "@/api/memory";
import { getMemory } from "./getMemory";
import { Memory } from "@/dialogue/class.memory";
import { SettingsContainer } from "@/settings/class.SettingsContainer";

jest.mock("@/api/memory", () => ({
  get: jest.fn(),
}));

describe("getMemory", () => {
  const apiGetMock = get as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get memory by key", async () => {
    const key = "my-memory-key";
    const mockResponse = {
      key,
      value: "test value",
      type: "string",
      tags: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      metadata: {},
    };

    apiGetMock.mockResolvedValueOnce(mockResponse);

    const memory = await getMemory({ key });

    expect(apiGetMock).toHaveBeenCalledTimes(1);
    expect(apiGetMock).toHaveBeenCalledWith({ key }, expect.anything());
    expect(memory).toBeInstanceOf(Memory);
    expect(memory?.key).toBe(key);
    expect(memory?.value).toBe("test value");
    expect(memory?.type).toBe("string");
  });

  it("should return null when memory not found", async () => {
    apiGetMock.mockResolvedValueOnce(null);

    const memory = await getMemory({ key: "nonexistent" });

    expect(apiGetMock).toHaveBeenCalledTimes(1);
    expect(memory).toBeNull();
  });

  it("should get memory with all fields populated", async () => {
    const key = "full-memory";
    const mockResponse = {
      key,
      namespace: "my-namespace",
      label: "My Label",
      description: "A description",
      value: { nested: { data: true } },
      type: "object",
      tags: ["tag1", "tag2"],
      created: "2024-01-01T00:00:00.000Z",
      modified: "2024-01-02T00:00:00.000Z",
      metadata: { priority: 1, active: true },
    };

    apiGetMock.mockResolvedValueOnce(mockResponse);

    const memory = await getMemory({ key });

    expect(memory).toBeInstanceOf(Memory);
    expect(memory?.key).toBe(key);
    expect(memory?.namespace).toBe("my-namespace");
    expect(memory?.label).toBe("My Label");
    expect(memory?.description).toBe("A description");
    expect(memory?.value).toEqual({ nested: { data: true } });
    expect(memory?.type).toBe("object");
    expect(memory?.tags).toEqual(["tag1", "tag2"]);
    expect(memory?.created).toBe("2024-01-01T00:00:00.000Z");
    expect(memory?.modified).toBe("2024-01-02T00:00:00.000Z");
  });

  it("should use provided settings", async () => {
    const key = "test-key";
    const settings = new SettingsContainer();
    settings.set("apiKey", "custom-key");
    settings.set("endpoint", "https://custom.api.com");

    const mockResponse = {
      key,
      value: 42,
      type: "number",
      tags: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      metadata: {},
    };

    apiGetMock.mockResolvedValueOnce(mockResponse);

    const memory = await getMemory({ key }, settings);

    expect(apiGetMock).toHaveBeenCalledWith({ key }, settings);
    expect(memory?.value).toBe(42);
  });

  it("should handle array value type", async () => {
    const key = "array-memory";
    const mockResponse = {
      key,
      value: [{ item: 1 }, { item: 2 }],
      type: "array",
      tags: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      metadata: {},
    };

    apiGetMock.mockResolvedValueOnce(mockResponse);

    const memory = await getMemory({ key });

    expect(memory?.type).toBe("array");
    expect(memory?.value).toEqual([{ item: 1 }, { item: 2 }]);
  });

  it("should handle boolean value type", async () => {
    const key = "bool-memory";
    const mockResponse = {
      key,
      value: true,
      type: "boolean",
      tags: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      metadata: {},
    };

    apiGetMock.mockResolvedValueOnce(mockResponse);

    const memory = await getMemory({ key });

    expect(memory?.type).toBe("boolean");
    expect(memory?.value).toBe(true);
  });
});