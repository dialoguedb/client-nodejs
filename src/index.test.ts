import * as modules from ".";

describe("dialogue", () => {
  it("has default export", async () => {
    expect(typeof modules.api).toBe("object");
    expect(typeof modules.api.dialogue).toBe("object");
    expect(typeof modules.api.dialogue.create).toBe("function");
    expect(typeof modules.api.dialogue.list).toBe("function");
    expect(typeof modules.api.dialogue.get).toBe("function");
    expect(typeof modules.api.dialogue.update).toBe("function");

    expect(typeof modules.api.messages).toBe("object");
    expect(typeof modules.api.messages.create).toBe("function");
    expect(typeof modules.api.messages.list).toBe("function");
    expect(typeof modules.api.messages.remove).toBe("function");

    expect(typeof modules.createConfig).toBe("function");
    expect(typeof modules.settings).toBe("object");
    expect(typeof modules.getOrCreateDialogue).toBe("function");
    expect(typeof modules.createDialogue).toBe("function");
    expect(typeof modules.listDialogues).toBe("function");
    expect(typeof modules.getDialogue).toBe("function");
  });
});
