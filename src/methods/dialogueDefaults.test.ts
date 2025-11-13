import { assertDialogue } from "@/utils/assertIsDialogue";
import { dialogueDefaults } from "./dialogueDefaults";

describe("createDialogue", () => {
  it("will create if given id that does not exist", async () => {
    const id = "non-existing-item-id";
    const dialogue = dialogueDefaults({ id });
    expect(typeof dialogue.id).toBe("string");
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });
});
