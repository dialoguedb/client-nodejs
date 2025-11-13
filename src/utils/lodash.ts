/**
 * Gets a value from an object at a given path
 * @param obj - The object to query
 * @param path - The path of the property to get (e.g., 'a.b.c' or ['a', 'b', 'c'])
 * @param defaultValue - The value returned if the resolved value is undefined
 */
export function get<T = any>(
  obj: any,
  path: string | string[],
  defaultValue?: T
): T {
  const pathArray = Array.isArray(path)
    ? path
    : path.split(".").filter(Boolean);

  let result = obj;
  for (const key of pathArray) {
    if (result == null) {
      return defaultValue as T;
    }
    result = result[key];
  }

  return result === undefined ? (defaultValue as T) : result;
}

/**
 * Sets a value on an object at a given path
 * @param obj - The object to modify
 * @param path - The path of the property to set (e.g., 'a.b.c' or ['a', 'b', 'c'])
 * @param value - The value to set
 */
export function set<T extends object>(
  obj: T,
  path: string | string[],
  value: any
): T {
  const pathArray = Array.isArray(path)
    ? path
    : path.split(".").filter(Boolean);

  let current: any = obj;
  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i];
    if (!(key in current) || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }

  current[pathArray[pathArray.length - 1]] = value;
  return obj;
}

/**
 * Creates an object composed of the picked properties
 * @param obj - The source object
 * @param keys - The property keys to pick
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Assigns default properties to an object
 * @param obj - The destination object
 * @param sources - The source objects
 */
export function defaults<T extends object>(
  obj: Partial<T>,
  ...sources: Array<Partial<T>>
): T {
  const result = { ...obj } as any;
  for (const source of sources.reverse()) {
    for (const key in source) {
      if (!(key in result) || result[key] === undefined) {
        result[key] = source[key]!;
      }
    }
  }
  return result as T;
}

export function isNull(value: any): boolean {
  return Object.is(value, null);
}

export function isUndefined(value: any): boolean {
  return value === undefined || typeof value === undefined;
}

export function isFinite(value: any): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

export function toNumber(value: any): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }
  return NaN;
}
