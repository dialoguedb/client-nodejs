import { errors, DialogueDBError } from "./index";

describe("errors factory", () => {
  describe("missingParameter", () => {
    it("creates DialogueDBError with correct properties", () => {
      const error = errors.missingParameter("userId");

      expect(error).toBeInstanceOf(DialogueDBError);
      expect(error.message).toBe("userId is required");
      expect(error.code).toBe("MISSING_PARAMETER");
      expect(error.type).toBe("VALIDATION");
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual([
        { field: "userId", code: "REQUIRED", message: "userId is required" },
      ]);
    });
  });

  describe("invalidParameter", () => {
    it("creates DialogueDBError with correct properties", () => {
      const error = errors.invalidParameter("limit", "must be a positive integer", -5);

      expect(error).toBeInstanceOf(DialogueDBError);
      expect(error.message).toBe("Invalid limit: must be a positive integer");
      expect(error.code).toBe("INVALID_PARAMETER");
      expect(error.type).toBe("VALIDATION");
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual([
        { field: "limit", code: "INVALID", message: "must be a positive integer", value: -5 },
      ]);
    });

    it("works without value parameter", () => {
      const error = errors.invalidParameter("tags", "must be an array");

      expect(error.details).toEqual([
        { field: "tags", code: "INVALID", message: "must be an array", value: undefined },
      ]);
    });
  });

  describe("validationError", () => {
    it("creates DialogueDBError with message only", () => {
      const error = errors.validationError("Multiple validation errors occurred");

      expect(error).toBeInstanceOf(DialogueDBError);
      expect(error.message).toBe("Multiple validation errors occurred");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.type).toBe("VALIDATION");
      expect(error.statusCode).toBe(400);
      expect(error.details).toBeUndefined();
    });

    it("creates DialogueDBError with details", () => {
      const details = [
        { field: "email", code: "INVALID_FORMAT", message: "Invalid email format" },
        { field: "age", code: "OUT_OF_RANGE", message: "Must be between 0 and 150", value: 200 },
      ];

      const error = errors.validationError("Validation failed", details);

      expect(error.details).toEqual(details);
    });
  });

  describe("notImplemented", () => {
    it("creates DialogueDBError with correct properties", () => {
      const error = errors.notImplemented("compact");

      expect(error).toBeInstanceOf(DialogueDBError);
      expect(error.message).toBe("compact() is not yet implemented");
      expect(error.code).toBe("NOT_IMPLEMENTED");
      expect(error.type).toBe("SERVER");
      expect(error.statusCode).toBe(501);
    });
  });
});
