import { isObjectEmpty } from "./isObjectEmpty";

describe("isObjectEmpty", () => {
  it("should return true for empty object", () => {
    expect(isObjectEmpty({})).toBe(true);
  });

  it("should return false for object with properties", () => {
    expect(isObjectEmpty({ a: 1 })).toBe(false);
  });

  it("should return false for object with multiple properties", () => {
    expect(isObjectEmpty({ a: 1, b: 2, c: 3 })).toBe(false);
  });

  it("should return false for object with undefined value", () => {
    expect(isObjectEmpty({ a: undefined })).toBe(false);
  });

  it("should return false for object with null value", () => {
    expect(isObjectEmpty({ a: null })).toBe(false);
  });

  it("should return false for object with falsy values", () => {
    expect(isObjectEmpty({ a: 0 })).toBe(false);
    expect(isObjectEmpty({ a: false })).toBe(false);
    expect(isObjectEmpty({ a: "" })).toBe(false);
  });

  it("should return false for object with nested objects", () => {
    expect(isObjectEmpty({ a: {} })).toBe(false);
  });

  it("should not count inherited properties", () => {
    const proto = { inherited: "value" };
    const obj = Object.create(proto);
    expect(isObjectEmpty(obj)).toBe(true);
  });

  it("should count own properties only", () => {
    const proto = { inherited: "value" };
    const obj = Object.create(proto);
    obj.own = "value";
    expect(isObjectEmpty(obj)).toBe(false);
  });
});
