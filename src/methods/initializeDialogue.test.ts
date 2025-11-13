import { assertDialogue } from "@/utils/assertIsDialogue";
import { initializeDialogue } from "./initializeDialogue";

describe("initializeDialogue", () => {
  it("initializeDialogue accepts undefined id", async () => {
    const dialogue = initializeDialogue();
    expect(typeof dialogue.id).toBe("string");
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });
  it("initializeDialogue accepts no id", async () => {
    const dialogue = initializeDialogue("");
    expect(typeof dialogue.id).toBe("string");
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });
  it("initializeDialogue accepts no id", async () => {
    // @ts-expect-error null
    const dialogue = initializeDialogue(null);
    expect(typeof dialogue.id).toBe("string");
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });
  it("initializeDialogue accepts string as id", async () => {
    const id = "custom-id";
    const dialogue = initializeDialogue(id);
    expect(dialogue.id).toBe(id);
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });
  it("initializeDialogue accepts number as id", async () => {
    const id = 243;
    const dialogue = initializeDialogue(id);
    expect(dialogue.id).toBe(id.toString());
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });
  it("initializeDialogue accepts number as id", async () => {
    const id = -1;
    const dialogue = initializeDialogue(id);
    expect(dialogue.id).toBeTruthy();
    expect(dialogue.id).not.toBe("-1");
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });
  it("initializeDialogue accepts object with id", async () => {
    const id = "custom-id";
    const dialogue = initializeDialogue({ id });
    expect(dialogue.id).toBe(id);
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });
  it("initializeDialogue accepts object with no id", async () => {
    const dialogue = initializeDialogue({});
    expect(typeof dialogue.id).toBe("string");
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });
});
