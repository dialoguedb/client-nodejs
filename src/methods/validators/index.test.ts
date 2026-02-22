import * as validators from "./index";

describe("validators", () => {
  it("exports dialogue validators", () => {
    expect(typeof validators.validateCreateDialogueInput).toBe("function");
    expect(typeof validators.validateUpdateDialogueInput).toBe("function");
    expect(typeof validators.validateGetDialogueInput).toBe("function");
    expect(typeof validators.validateListDialogueFilters).toBe("function");
  });

  it("exports message validators", () => {
    expect(typeof validators.validateCreateMessageInput).toBe("function");
    expect(typeof validators.validateGetMessageInput).toBe("function");
    expect(typeof validators.validateListMessageFilters).toBe("function");
  });
});
