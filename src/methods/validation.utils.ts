export function isProbablyISOString(str: string) {
  return (
    typeof str === "string" &&
    str.length >= 20 &&
    str[10] === "T" &&
    str[str.length - 1] === "Z"
  );
}
