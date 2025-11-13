export function safeParseJson<T = any>(objOrMaybeJSON: any): T {
  if (typeof objOrMaybeJSON === "string") {
    return JSON.parse(objOrMaybeJSON) as T;
  }
  return objOrMaybeJSON as T;
}

export function safeStringifyJson(objOrMaybeJSON: any) {
  if (typeof objOrMaybeJSON === "string") {
    return objOrMaybeJSON;
  }
  if (objOrMaybeJSON && typeof objOrMaybeJSON === "object") {
    return JSON.stringify(objOrMaybeJSON);
  }
  return objOrMaybeJSON;
}
