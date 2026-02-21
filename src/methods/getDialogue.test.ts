import { assertDialogue } from "@/utils/assertIsDialogue";
import { get } from "@/api/dialogue";
import { getDialogue } from "./getDialogue";
import { DialogueDBError } from "@/utils/request";

jest.mock("@/api/dialogue", () => ({
  get: jest.fn(),
}));

describe("getDialogue", () => {
  const apiGetMock = get as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getDialogue get by id", async () => {
    const id = "item-id";

    apiGetMock.mockResolvedValueOnce({
      id,
    });

    const dialogue = await getDialogue({ id });
    expect(apiGetMock).toHaveBeenCalledTimes(1);
    expect(typeof dialogue?.id).toBe("string");
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });

  it("returns null when API returns null", async () => {
    apiGetMock.mockResolvedValueOnce(null);

    const dialogue = await getDialogue({ id: "nonexistent" });
    expect(apiGetMock).toHaveBeenCalledTimes(1);
    expect(dialogue).toBeNull();
  });

  it("returns null when API returns undefined", async () => {
    apiGetMock.mockResolvedValueOnce(undefined);

    const dialogue = await getDialogue({ id: "nonexistent" });
    expect(dialogue).toBeNull();
  });

  it("returns null when API throws 404 DialogueDBError", async () => {
    apiGetMock.mockRejectedValueOnce(
      new DialogueDBError(
        "Dialogue 'nonexistent' not found",
        "DIALOGUE_NOT_FOUND",
        "NOT_FOUND",
        404
      )
    );

    const dialogue = await getDialogue({ id: "nonexistent" });
    expect(dialogue).toBeNull();
  });

  it("throws non-404 errors", async () => {
    apiGetMock.mockRejectedValueOnce(
      new DialogueDBError("Internal server error", "INTERNAL_ERROR", "SERVER", 500)
    );

    await expect(getDialogue({ id: "some-id" })).rejects.toThrow(DialogueDBError);
  });
});
