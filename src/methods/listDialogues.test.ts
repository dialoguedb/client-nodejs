import { assertDialogue } from "@/utils/assertIsDialogue";
import { list } from "@/api/dialogue/dialogue.list";
import { listDialogues } from "./listDialogues";

jest.mock("@/api/dialogue/dialogue.list", () => ({
  list: jest.fn(),
}));

describe("listDialogues", () => {
  const apiListMock = list as jest.Mock;
  // const useSettingsMock = useSettings as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("listDialogues get list", async () => {
    const id = "item-id";

    apiListMock.mockResolvedValueOnce({
      items: [
        {
          id,
        },
      ],
    });

    const { items } = await listDialogues();
    expect(apiListMock).toHaveBeenCalledTimes(1);
    expect(typeof items[0].id).toBe("string");
    items.forEach((d) => {
      expect(() => assertDialogue(d)).not.toThrow();
    });
  });
});
