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

  it("will create if given id that does not exist", async () => {
    const id = "non-existing-item-id";
    apiCreateMock.mockResolvedValueOnce({
      id,
    });

    const dialogue = await createDialogue();
    expect(apiCreateMock).toHaveBeenCalledTimes(1);
    expect(apiCreateMock).toHaveBeenCalledWith(
      {
        id: expect.any(String),
      },
      expect.anything()
    );
    expect(typeof dialogue.id).toBe("string");
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });
});
