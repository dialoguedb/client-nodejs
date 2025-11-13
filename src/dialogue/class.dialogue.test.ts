import { ulid } from "ulid";
import { Dialogue } from "./class.dialogue";
import { update } from "@/api/dialogue/dialogue.update";

jest.mock("@/api/dialogue/dialogue.update", () => ({
  update: jest.fn(),
}));

describe("class.dialogue", () => {
  const apiUpdateMock = update as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("instantiate Dialogue", async () => {
    const id = ulid();
    const dialogue = new Dialogue({ id });
    expect(typeof dialogue.id).toBe("string");
    expect(dialogue.id).toBe(id);
    expect(dialogue.messages).toEqual([]);
  });

  it("has save method for state/metadata", async () => {
    const id = ulid();

    apiUpdateMock.mockResolvedValueOnce({
      id,
      state: { key: "value" },
      metadata: {},
      messages: [],
      tags: [],
      expired: false,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    });

    const dialogue = new Dialogue({ id });

    dialogue.setState({ key: "value" });
    await dialogue.save();

    expect(apiUpdateMock).toHaveBeenCalledWith(
      {
        id: id,
        state: { key: "value" },
      },
      expect.anything()
    );
  });

  it("isDirty returns false when no changes", async () => {
    const id = ulid();
    const dialogue = new Dialogue({ id });
    expect(dialogue.isDirty).toBe(false);
  });

  it("isDirty returns true when state changed", async () => {
    const id = ulid();
    const dialogue = new Dialogue({ id });
    dialogue.setState({ key: "value" });
    expect(dialogue.isDirty).toBe(true);
  });
});
