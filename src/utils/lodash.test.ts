import {
  toNumber,
  isUndefined,
  isNull,
  isFinite,
  get,
  set,
  pick,
  defaults,
  isPlainObject,
} from "@/utils/lodash";

describe("toNumber", () => {
  it("toNumber casts string to number", async () => {
    const value = "42";
    expect(toNumber(value)).toBe(42);
  });
  it("toNumber returns number for number", async () => {
    const value = 42;
    expect(toNumber(value)).toBe(42);
  });
  it("toNumber returns NaN for {}", async () => {
    const value = {};
    expect(toNumber(value)).toBe(NaN);
  });
  it("toNumber returns NaN for ''", async () => {
    const value = "";
    expect(toNumber(value)).toBe(NaN);
  });
});

describe("isUndefined", () => {
  it("isUndefined detects undefined", async () => {
    let value;
    expect(isUndefined(value)).toBe(true);
  });
  it("isUndefined returns false for null", async () => {
    const value = null;
    expect(isUndefined(value)).toBe(false);
  });
  it("isUndefined returns false for {}", async () => {
    const value = {};
    expect(isUndefined(value)).toBe(false);
  });
});

describe("isFinite", () => {
  it("isFinite detects number", async () => {
    const value = 100;
    expect(isFinite(value)).toBe(true);
  });
  it("isFinite detects number", async () => {
    const value = 1.0;
    expect(isFinite(value)).toBe(true);
  });
  it("isFinite returns true for -1", async () => {
    const value = -1;
    expect(isFinite(value)).toBe(true);
  });
  it("isFinite returns false for NaN", async () => {
    const value = NaN;
    expect(isFinite(value)).toBe(false);
  });
});

describe("isNull", () => {
  it("isNull detects null", async () => {
    const value = null;
    expect(isNull(value)).toBe(true);
  });
  it("isNull returns false for undefined", async () => {
    const value = undefined;
    expect(isNull(value)).toBe(false);
  });
  it("isNull returns false for {}", async () => {
    const value = {};
    expect(isNull(value)).toBe(false);
  });
});

describe("get", () => {
  it("should get value from nested object with string path", () => {
    const obj = { a: { b: { c: "value" } } };
    expect(get(obj, "a.b.c")).toBe("value");
  });

  it("should get value from nested object with array path", () => {
    const obj = { a: { b: { c: "value" } } };
    expect(get(obj, ["a", "b", "c"])).toBe("value");
  });

  it("should return default value when path does not exist", () => {
    const obj = { a: { b: "value" } };
    expect(get(obj, "a.b.c", "default")).toBe("default");
  });

  it("should handle null values in path", () => {
    const obj = { a: null };
    expect(get(obj, "a.b.c", "default")).toBe("default");
  });

  it("should get shallow property", () => {
    const obj = { a: "value" };
    expect(get(obj, "a")).toBe("value");
  });
});

describe("set", () => {
  it("should set value in nested object with string path", () => {
    const obj: any = { a: { b: {} } };
    set(obj, "a.b.c", "value");
    expect(obj.a.b.c).toBe("value");
  });

  it("should set value in nested object with array path", () => {
    const obj: any = { a: { b: {} } };
    set(obj, ["a", "b", "c"], "value");
    expect(obj.a.b.c).toBe("value");
  });

  it("should create missing nested objects", () => {
    const obj: any = {};
    set(obj, "a.b.c", "value");
    expect(obj.a.b.c).toBe("value");
  });

  it("should set shallow property", () => {
    const obj: any = {};
    set(obj, "a", "value");
    expect(obj.a).toBe("value");
  });

  it("should return the same object", () => {
    const obj = {};
    const result = set(obj, "a.b", "value");
    expect(result).toBe(obj);
  });
});

describe("pick", () => {
  it("should pick specified keys from object", () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = pick(obj, "a", "c");
    expect(result).toEqual({ a: 1, c: 3 });
  });

  it("should ignore keys that do not exist", () => {
    const obj = { a: 1, b: 2 };
    const result = pick(obj, "a", "c" as any);
    expect(result).toEqual({ a: 1 });
  });

  it("should return empty object when no keys specified", () => {
    const obj = { a: 1, b: 2 };
    const result = pick(obj);
    expect(result).toEqual({});
  });
});

describe("defaults", () => {
  it("should apply defaults for missing properties", () => {
    const obj: any = { a: 1 };
    const result = defaults(obj, { a: 2, b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it("should apply defaults for undefined properties", () => {
    const obj: any = { a: 1, b: undefined };
    const result = defaults(obj, { b: 2, c: 3 });
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("should apply multiple default sources with earlier sources taking priority", () => {
    const obj: any = { a: 1 };
    // Earlier sources have higher priority (matches lodash behavior)
    const result = defaults(obj, { a: 2, b: 2 } as any, { b: 3, c: 3 } as any);
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("should not overwrite null values", () => {
    const obj: any = { a: null };
    const result = defaults(obj, { a: 1 });
    expect(result).toEqual({ a: null });
  });
});

describe("isPlainObject", () => {
  it("returns true for plain object literal", () => {
    expect(isPlainObject({})).toBe(true);
  });

  it("returns true for object with properties", () => {
    expect(isPlainObject({ a: 1, b: 2 })).toBe(true);
  });

  it("returns true for Object.create(null)", () => {
    expect(isPlainObject(Object.create(null))).toBe(true);
  });

  it("returns false for null", () => {
    expect(isPlainObject(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isPlainObject(undefined)).toBe(false);
  });

  it("returns false for arrays", () => {
    expect(isPlainObject([1, 2, 3])).toBe(false);
  });

  it("returns false for class instances", () => {
    class Foo {}
    expect(isPlainObject(new Foo())).toBe(false);
  });

  it("returns false for Date", () => {
    expect(isPlainObject(new Date())).toBe(false);
  });

  it("returns false for RegExp", () => {
    expect(isPlainObject(/test/)).toBe(false);
  });

  it("returns false for strings", () => {
    expect(isPlainObject("string")).toBe(false);
  });

  it("returns false for numbers", () => {
    expect(isPlainObject(42)).toBe(false);
  });

  it("returns false for Map", () => {
    expect(isPlainObject(new Map())).toBe(false);
  });

  it("handles object with custom prototype that has no constructor", () => {
    const proto = Object.create(null);
    const obj = Object.create(proto);
    expect(isPlainObject(obj)).toBe(false);
  });
});
