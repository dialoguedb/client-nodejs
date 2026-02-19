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
});
