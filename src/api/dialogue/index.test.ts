import * as dialogueApi from "./index";

describe("api/dialogue", () => {
  it("exports create, remove, list, get, update, end", () => {
    expect(typeof dialogueApi.create).toBe("function");
    expect(typeof dialogueApi.remove).toBe("function");
    expect(typeof dialogueApi.list).toBe("function");
    expect(typeof dialogueApi.get).toBe("function");
    expect(typeof dialogueApi.update).toBe("function");
    expect(typeof dialogueApi.end).toBe("function");
  });
});
