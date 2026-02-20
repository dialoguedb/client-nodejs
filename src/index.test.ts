import * as modules from ".";

describe("dialogue", () => {
  it("has expected exports", async () => {
    expect(typeof modules.api).toBe("object");
    expect(typeof modules.api.dialogue).toBe("object");
    expect(typeof modules.api.dialogue.create).toBe("function");
    expect(typeof modules.api.dialogue.list).toBe("function");
    expect(typeof modules.api.dialogue.get).toBe("function");
    expect(typeof modules.api.dialogue.update).toBe("function");

    expect(typeof modules.api.messages).toBe("object");
    expect(typeof modules.api.messages.create).toBe("function");
    expect(typeof modules.api.messages.list).toBe("function");

    expect(typeof modules.createConfig).toBe("function");
    expect(typeof modules.settings).toBe("object");
    expect(typeof modules.DialogueDB).toBe("function");
  });

  it("exports Dialogue, Message, and Memory classes", () => {
    expect(typeof modules.Dialogue).toBe("function");
    expect(typeof modules.Message).toBe("function");
    expect(typeof modules.Memory).toBe("function");
  });

  it("exports setGlobalConfig for config isolation", () => {
    expect(typeof modules.setGlobalConfig).toBe("function");
  });

  it("exports api.message with all CRUD operations", () => {
    expect(typeof modules.api.message).toBe("object");
    expect(typeof modules.api.message.get).toBe("function");
    expect(typeof modules.api.message.create).toBe("function");
    expect(typeof modules.api.message.update).toBe("function");
    expect(typeof modules.api.message.remove).toBe("function");
  });

  it("exports api.memory with all CRUD operations", () => {
    expect(typeof modules.api.memory).toBe("object");
    expect(typeof modules.api.memory.create).toBe("function");
    expect(typeof modules.api.memory.get).toBe("function");
    expect(typeof modules.api.memory.update).toBe("function");
    expect(typeof modules.api.memory.remove).toBe("function");
    expect(typeof modules.api.memory.list).toBe("function");
  });

  it("exports DialogueDBError class", () => {
    expect(typeof modules.DialogueDBError).toBe("function");
  });
});
