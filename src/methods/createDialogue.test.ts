import { assertDialogue } from "@/utils/assertIsDialogue";
import { create } from "@/api/dialogue";
import { createDialogue } from "./createDialogue";

jest.mock("@/api/dialogue", () => ({
  create: jest.fn(),
}));

describe("createDialogue", () => {
  const apiCreateMock = create as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("will create given id", async () => {
    const id = "created-item-id";

    apiCreateMock.mockResolvedValueOnce({
      id,
      expired: false,
      state: {},
      messages: [],
      metadata: {},
      tags: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    });

    const dialogue = await createDialogue({ id });
    expect(apiCreateMock).toHaveBeenCalledTimes(1);
    expect(apiCreateMock).toHaveBeenCalledWith(
      {
        id,
      },
      expect.anything()
    );
    expect(typeof dialogue.id).toBe("string");
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });

  it("will create given id and namespace", async () => {
    const id = "created-item-id";
    const namespace = "my-namespace";

    apiCreateMock.mockResolvedValueOnce({
      id,
      namespace,
      expired: false,
      state: {},
      messages: [],
      metadata: {},
      tags: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    });

    const dialogue = await createDialogue({ id, namespace });
    expect(apiCreateMock).toHaveBeenCalledTimes(1);
    expect(apiCreateMock).toHaveBeenCalledWith(
      {
        id,
        namespace,
      },
      expect.anything()
    );
    expect(typeof dialogue.id).toBe("string");
    expect(dialogue.id).toBe(id);
    expect(typeof dialogue.namespace).toBe("string");
    expect(dialogue.namespace).toBe(namespace);
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });

  it("will create with empty input when no id provided", async () => {
    const id = "server-generated-id";
    apiCreateMock.mockResolvedValueOnce({
      id,
      expired: false,
      state: {},
      messages: [],
      metadata: {},
      tags: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    });

    const dialogue = await createDialogue();
    expect(apiCreateMock).toHaveBeenCalledTimes(1);
    expect(apiCreateMock).toHaveBeenCalledWith({}, expect.anything());
    expect(typeof dialogue.id).toBe("string");
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });
});
