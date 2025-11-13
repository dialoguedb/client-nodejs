import { safeStringifyJson, safeParseJson } from "@/utils/json";

describe("safeStringifyJson", () => {
  it("should return strings unchanged", () => {
    const input = "hello world";
    expect(safeStringifyJson(input)).toBe("hello world");
  });

  it("should stringify objects", () => {
    const input = { a: 1, b: "two" };
    expect(safeStringifyJson(input)).toBe('{"a":1,"b":"two"}');
  });

  it("should stringify arrays", () => {
    const input = [1, "two", { a: 1 }];
    expect(safeStringifyJson(input)).toBe('[1,"two",{"a":1}]');
  });

  it("should return null unchanged", () => {
    expect(safeStringifyJson(null)).toBe(null);
  });

  it("should return undefined unchanged", () => {
    expect(safeStringifyJson(undefined)).toBe(undefined);
  });

  it("should return numbers unchanged", () => {
    expect(safeStringifyJson(42)).toBe(42);
  });

  it("should return booleans unchanged", () => {
    expect(safeStringifyJson(true)).toBe(true);
  });

  it("should throw on circular references", () => {
    const obj: any = { a: 1 };
    obj.b = obj;
    expect(() => safeStringifyJson(obj)).toThrow();
  });
});

describe("safeParseJson", () => {
  it("should parse valid JSON strings", () => {
    const input = '{"key":"value"}';
    expect(safeParseJson(input)).toEqual({ key: "value" });
  });

  it("should parse JSON arrays", () => {
    const input = "[1,2,3]";
    expect(safeParseJson(input)).toEqual([1, 2, 3]);
  });

  it("should return objects unchanged", () => {
    const input = { key: "value" };
    expect(safeParseJson(input)).toBe(input);
  });

  it("should return arrays unchanged", () => {
    const input = [1, 2, 3];
    expect(safeParseJson(input)).toBe(input);
  });

  it("should return null unchanged", () => {
    expect(safeParseJson(null)).toBe(null);
  });

  it("should return undefined unchanged", () => {
    expect(safeParseJson(undefined)).toBe(undefined);
  });

  it("should return numbers unchanged", () => {
    expect(safeParseJson(42)).toBe(42);
  });

  it("should throw on invalid JSON", () => {
    const input = "{invalid json}";
    expect(() => safeParseJson(input)).toThrow();
  });

  it("should parse nested objects", () => {
    const input = '{"outer":{"inner":"value"}}';
    expect(safeParseJson(input)).toEqual({ outer: { inner: "value" } });
  });
});
