import { isProbablyISOString } from "./validation.utils";

describe("validation.utils", () => {
  describe("isProbablyISOString", () => {
    it("should return true for valid ISO 8601 string", () => {
      expect(isProbablyISOString("2024-01-01T00:00:00.000Z")).toBe(true);
      expect(isProbablyISOString("2024-12-31T23:59:59.999Z")).toBe(true);
      expect(isProbablyISOString("1999-01-01T12:30:45.123Z")).toBe(true);
    });

    it("should return false for non-string values", () => {
      expect(isProbablyISOString(123 as any)).toBe(false);
      expect(isProbablyISOString(null as any)).toBe(false);
      expect(isProbablyISOString(undefined as any)).toBe(false);
      expect(isProbablyISOString({} as any)).toBe(false);
      expect(isProbablyISOString([] as any)).toBe(false);
    });

    it("should return false for strings that are too short", () => {
      expect(isProbablyISOString("short")).toBe(false);
      expect(isProbablyISOString("")).toBe(false);
    });

    it("should return true for edge case valid formats", () => {
      expect(isProbablyISOString("2024-01-01T00:00:00Z")).toBe(true);
      expect(isProbablyISOString("2024-01-01T00:00:00.0Z")).toBe(true);
      expect(isProbablyISOString("2024-01-01T00:00:00.00Z")).toBe(true);
    });
  });
});
