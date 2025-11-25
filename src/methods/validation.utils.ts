// Checks if string looks like an ISO date (YYYY-MM-DD...)
export function isProbablyISOString(str: string) {
  return (
    typeof str === "string" &&
    str.length >= 10 &&
    /^\d{4}-\d{2}-\d{2}/.test(str)
  );
}
