import { assertDialogue } from "./assertIsDialogue";

describe("assertIsDialogue", () => {
  it("should not throw for valid dialogue with id", () => {
    const dialogue = { id: "dialogue-123" };
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });

  it("should not throw for dialogue with additional properties", () => {
    const dialogue = {
      id: "dialogue-123",
      namespace: "my-namespace",
      messages: [],
      state: {},
    };
    expect(() => assertDialogue(dialogue)).not.toThrow();
  });

  it("should throw error when id is missing", () => {
    const dialogue = { namespace: "my-namespace" };
    expect(() => assertDialogue(dialogue)).toThrow("Not a dialogue");
  });

  it("should throw error when id is not a string", () => {
    const dialogue = { id: 123 };
    expect(() => assertDialogue(dialogue)).toThrow("Not a dialogue");
  });

  it("should throw error when id is null", () => {
    const dialogue = { id: null };
    expect(() => assertDialogue(dialogue)).toThrow("Not a dialogue");
  });

  it("should throw error when id is undefined", () => {
    const dialogue = { id: undefined };
    expect(() => assertDialogue(dialogue)).toThrow("Not a dialogue");
  });

  it("should throw error when id is empty string", () => {
    const dialogue = { id: "" };
    expect(() => assertDialogue(dialogue)).toThrow("Not a dialogue");
  });

  it("should throw error for null input", () => {
    expect(() => assertDialogue(null)).toThrow("Not a dialogue");
  });

  it("should throw error for undefined input", () => {
    expect(() => assertDialogue(undefined as any)).toThrow("Not a dialogue");
  });

  it("should throw error for array input", () => {
    expect(() => assertDialogue([] as any)).toThrow("Not a dialogue");
  });

  it("should throw error for string input", () => {
    expect(() => assertDialogue("dialogue-123" as any)).toThrow(
      "Not a dialogue"
    );
  });

  it("should throw error for number input", () => {
    expect(() => assertDialogue(123 as any)).toThrow("Not a dialogue");
  });
});
