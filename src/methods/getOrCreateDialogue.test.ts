import { assertDialogue } from "@/utils/assertIsDialogue";
import { get } from "@/api/dialogue";
import { getOrCreateDialogue } from "./getOrCreateDialogue";
import { createDialogue } from "./createDialogue";
import { DialogueDBError } from "@/errors";

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
    expect(createDialogueMock).toHaveBeenCalledWith({}, expect.anything());
    expect(typeof dialogue.id).toBe("string");
    expect(dialogue.id).toBe(id);
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });

  it("will create dialogue when given id that does not exist (null response)", async () => {
    const id = "non-existing-item-id";
    apiGetMock.mockResolvedValue(null);
    createDialogueMock.mockResolvedValueOnce({ id });

    const dialogue = await getOrCreateDialogue({ id });
    expect(createDialogueMock).toHaveBeenCalledTimes(1);
    expect(createDialogueMock).toHaveBeenCalledWith({ id }, expect.anything());
    expect(dialogue.id).toBe(id);
    apiGetMock.mockReset();
  });

  it("will create dialogue when get throws (not found)", async () => {
    const id = "some-id";
    apiGetMock.mockRejectedValue(
      new DialogueDBError("Not found", "DIALOGUE_NOT_FOUND", "not_found", 404)
    );
    createDialogueMock.mockResolvedValueOnce({ id });

    const dialogue = await getOrCreateDialogue({ id });
    expect(createDialogueMock).toHaveBeenCalledTimes(1);
    expect(dialogue.id).toBe(id);
    apiGetMock.mockReset();
  });

  it("will re-throw non-404 errors from get", async () => {
    const id = "some-id";
    apiGetMock.mockRejectedValue(
      new DialogueDBError("Internal error", "SERVER_ERROR", "server_error", 500)
    );

    await expect(getOrCreateDialogue({ id })).rejects.toThrow(DialogueDBError);
    expect(createDialogueMock).toHaveBeenCalledTimes(0);
    apiGetMock.mockReset();
  });

  it("will create dialogue when API returns response with no id field", async () => {
    const id = "some-id";
    apiGetMock.mockResolvedValueOnce({ status: "active" });
    createDialogueMock.mockResolvedValueOnce({ id });

    const dialogue = await getOrCreateDialogue({ id });
    expect(createDialogueMock).toHaveBeenCalledTimes(1);
    expect(dialogue.id).toBe(id);
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

  it("creates with remaining input when no id provided", async () => {
    createDialogueMock.mockResolvedValueOnce({ id: "new-id" });

    await getOrCreateDialogue({ namespace: "my-ns", threadOf: "parent" });

    expect(createDialogueMock).toHaveBeenCalledWith(
      { namespace: "my-ns", threadOf: "parent" },
      expect.anything()
    );
  });
});
