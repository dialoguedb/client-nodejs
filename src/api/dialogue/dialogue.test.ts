import * as api from ".";

describe("dialogue.api", () => {
  it("will call create", async () => {
    expect(typeof api.create).toBe("function");
    expect(typeof api.list).toBe("function");
    expect(typeof api.update).toBe("function");
    expect(typeof api.get).toBe("function");
  });
});
