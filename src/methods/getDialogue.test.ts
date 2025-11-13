import { assertDialogue } from "@/utils/assertIsDialogue";
import { get } from "@/api/dialogue";
import { getDialogue } from "./getDialogue";

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
});
