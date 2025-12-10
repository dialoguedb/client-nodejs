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

  it("should get memory by id", async () => {
    const id = "my-memory-id";
    const mockResponse = {
      id,
      value: "test value",
      tags: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      metadata: {},
    };

    apiGetMock.mockResolvedValueOnce(mockResponse);

    const memory = await getMemory({ id });

    expect(apiGetMock).toHaveBeenCalledTimes(1);
    expect(apiGetMock).toHaveBeenCalledWith({ id }, expect.anything());
    expect(memory).toBeInstanceOf(Memory);
    expect(memory?.id).toBe(id);
    expect(memory?.value).toBe("test value");
  });

  it("should return null when memory not found", async () => {
    apiGetMock.mockResolvedValueOnce(null);

    const memory = await getMemory({ id: "nonexistent" });

    expect(apiGetMock).toHaveBeenCalledTimes(1);
    expect(memory).toBeNull();
  });

  it("should get memory with all fields populated", async () => {
    const id = "full-memory";
    const mockResponse = {
      id,
      namespace: "my-namespace",
      label: "My Label",
      description: "A description",
      value: { nested: { data: true } },
      tags: ["tag1", "tag2"],
      created: "2024-01-01T00:00:00.000Z",
      modified: "2024-01-02T00:00:00.000Z",
      metadata: { priority: 1, active: true },
    };

    apiGetMock.mockResolvedValueOnce(mockResponse);

    const memory = await getMemory({ id });

    expect(memory).toBeInstanceOf(Memory);
    expect(memory?.id).toBe(id);
    expect(memory?.namespace).toBe("my-namespace");
    expect(memory?.label).toBe("My Label");
    expect(memory?.description).toBe("A description");
    expect(memory?.value).toEqual({ nested: { data: true } });
    expect(memory?.tags).toEqual(["tag1", "tag2"]);
    expect(memory?.created).toBe("2024-01-01T00:00:00.000Z");
    expect(memory?.modified).toBe("2024-01-02T00:00:00.000Z");
  });

  it("should use provided settings", async () => {
    const id = "test-key";
    const settings = new SettingsContainer();
    settings.set("apiKey", "custom-key");
    settings.set("endpoint", "https://custom.api.com");

    const mockResponse = {
      id,
      value: 42,
      tags: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      metadata: {},
    };

    apiGetMock.mockResolvedValueOnce(mockResponse);

    const memory = await getMemory({ id }, settings);

    expect(apiGetMock).toHaveBeenCalledWith({ id }, settings);
    expect(memory?.value).toBe(42);
  });

  it("should handle array value type", async () => {
    const id = "array-memory";
    const mockResponse = {
      id,
      value: [{ item: 1 }, { item: 2 }],
      tags: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      metadata: {},
    };

    apiGetMock.mockResolvedValueOnce(mockResponse);

    const memory = await getMemory({ id });

    expect(memory?.value).toEqual([{ item: 1 }, { item: 2 }]);
  });

  it("should handle boolean value type", async () => {
    const id = "bool-memory";
    const mockResponse = {
      id,
      value: true,
      tags: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      metadata: {},
    };

    apiGetMock.mockResolvedValueOnce(mockResponse);

    const memory = await getMemory({ id });

    expect(memory?.value).toBe(true);
  });
});
