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

  it("throws when API returns null", async () => {
    apiGetMock.mockResolvedValueOnce(null);

    await expect(getDialogue({ id: "nonexistent" })).rejects.toThrow(
      DialogueDBError
    );
    expect(apiGetMock).toHaveBeenCalledTimes(1);
  });

  it("throws when API returns undefined", async () => {
    apiGetMock.mockResolvedValueOnce(undefined);

    await expect(getDialogue({ id: "nonexistent" })).rejects.toThrow(
      DialogueDBError
    );
  });

  it("throws when API throws 404 DialogueDBError", async () => {
    apiGetMock.mockRejectedValueOnce(
      new DialogueDBError(
        "Dialogue 'nonexistent' not found",
        "DIALOGUE_NOT_FOUND",
        "not_found",
        404
      )
    );

    await expect(getDialogue({ id: "nonexistent" })).rejects.toThrow(
      DialogueDBError
    );
  });

  // The regression behind #94/#90: an unscoped lookup of a namespaced dialogue
  // 404s against the default namespace, and used to surface as a bare null.
  it("names the namespace to pass when the lookup was unscoped", async () => {
    apiGetMock.mockRejectedValueOnce(
      new DialogueDBError(
        "Dialogue 'abc' not found in namespace 'default'",
        "DIALOGUE_NOT_FOUND",
        "not_found",
        404,
        "req_123"
      )
    );

    await expect(getDialogue({ id: "abc" })).rejects.toThrow(
      `Dialogue 'abc' not found in the default namespace. If it was created with a namespace, pass it: getDialogue("abc", { namespace })`
    );
  });

  it("omits the hint when a namespace was already passed", async () => {
    apiGetMock.mockResolvedValueOnce(null);

    const error = await getDialogue({
      id: "abc",
      namespace: "student-001",
    }).catch((thrown) => thrown);

    expect(error).toBeInstanceOf(DialogueDBError);
    expect(error.message).toBe(
      "Dialogue 'abc' not found in namespace 'student-001'"
    );
  });

  // The request layer only sends a non-empty namespace, so an empty one is a
  // default-namespace lookup and must still be told about the namespace.
  it("treats an empty namespace as unscoped", async () => {
    apiGetMock.mockResolvedValueOnce(null);

    const error = await getDialogue({ id: "abc", namespace: "" }).catch(
      (thrown) => thrown
    );

    expect(error.message).toBe(
      `Dialogue 'abc' not found in the default namespace. If it was created with a namespace, pass it: getDialogue("abc", { namespace })`
    );
  });

  it("preserves requestId and code from the API's 404", async () => {
    apiGetMock.mockRejectedValueOnce(
      new DialogueDBError(
        "Dialogue 'abc' not found in namespace 'default'",
        "DIALOGUE_NOT_FOUND",
        "not_found",
        404,
        "req_123"
      )
    );

    await expect(getDialogue({ id: "abc" })).rejects.toMatchObject({
      code: "DIALOGUE_NOT_FOUND",
      type: "not_found",
      statusCode: 404,
      requestId: "req_123",
    });
  });

  it("throws non-404 errors", async () => {
    apiGetMock.mockRejectedValueOnce(
      new DialogueDBError(
        "Internal server error",
        "INTERNAL_ERROR",
        "server_error",
        500
      )
    );

    await expect(getDialogue({ id: "some-id" })).rejects.toThrow(
      DialogueDBError
    );
  });
});
