import { assertDialogue } from "@/utils/assertIsDialogue";
// import { useSettings } from "@/settings/useSettings";
import { get } from "@/api/dialogue";
import { getOrCreateDialogue } from "./getOrCreateDialogue";
import { createDialogue } from "./createDialogue";

jest.mock("@/api/dialogue", () => ({
  get: jest.fn(),
}));

jest.mock("./createDialogue", () => ({
  createDialogue: jest.fn(),
}));

describe("useDialogue", () => {
  const apiGetMock = get as jest.Mock;
  const createDialogueMock = createDialogue as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("will create if not given id", async () => {
    const id = "created-item-id";

    createDialogueMock.mockResolvedValueOnce({
      id,
    });

    const dialogue = await getOrCreateDialogue();
    expect(apiGetMock).toHaveBeenCalledTimes(0);
    expect(createDialogueMock).toHaveBeenCalledTimes(1);
    expect(createDialogueMock).toHaveBeenCalledWith(
      {},
      expect.anything()
    );
    expect(typeof dialogue.id).toBe("string");
    expect(dialogue.id).toBe(id);
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });

  it("will throw if given id that does not exist", async () => {
    const id = "non-existing-item-id";
    apiGetMock.mockResolvedValueOnce(null);

    await expect(getOrCreateDialogue({ id })).rejects.toThrow(
      `Dialogue with id "${id}" not found`
    );
    expect(apiGetMock).toHaveBeenCalledTimes(1);
    expect(apiGetMock).toHaveBeenCalledWith({ id }, expect.anything());
    expect(createDialogueMock).toHaveBeenCalledTimes(0);
  });

  it("will use existing item if found by id", async () => {
    const id = "existing-item-id";

    apiGetMock.mockResolvedValueOnce({
      id,
    });

    const dialogue = await getOrCreateDialogue({ id });
    expect(apiGetMock).toHaveBeenCalledTimes(1);
    expect(apiGetMock).toHaveBeenCalledWith({ id }, expect.anything());
    expect(createDialogueMock).toHaveBeenCalledTimes(0);
    expect(typeof dialogue.id).toBe("string");
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });
});
