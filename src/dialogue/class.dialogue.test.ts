import { ulid } from "ulid";
import { Dialogue } from "./class.dialogue";
import { update } from "@/api/dialogue/dialogue.update";
import { IDialogue } from "@/types";

jest.mock("@/api/dialogue/dialogue.update", () => ({
  update: jest.fn(),
}));

function createMockDialogue(overrides: Partial<IDialogue> = {}): IDialogue {
  return {
    id: ulid(),
    expired: false,
    state: {},
    messages: [],
    metadata: {},
    tags: [],
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    ...overrides,
  };
}

describe("class.dialogue", () => {
  const apiUpdateMock = update as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("instantiate Dialogue", async () => {
    const id = ulid();
    const dialogue = new Dialogue(createMockDialogue({ id }));
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

    const dialogue = new Dialogue(createMockDialogue({ id }));

    dialogue.state = { key: "value" };
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
    const dialogue = new Dialogue(createMockDialogue({ id }));
    expect(dialogue.isDirty).toBe(false);
  });

  it("isDirty returns true when state changed", async () => {
    const id = ulid();
    const dialogue = new Dialogue(createMockDialogue({ id }));
    dialogue.state = { key: "value" };
    expect(dialogue.isDirty).toBe(true);
  });
});
