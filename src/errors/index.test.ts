import { errors, DialogueDBError, isNotFoundError } from "./index";

describe("isNotFoundError", () => {
  it("matches the API's structured not-found response", () => {
    const error = new DialogueDBError(
      "Dialogue 'abc' not found in namespace 'default'",
      "DIALOGUE_NOT_FOUND",
      "not_found",
      404
    );

    expect(isNotFoundError(error)).toBe(true);
  });

  // A 404 from the gateway rather than the API carries no structured body, so
  // request.ts falls back to `server_error`. Reading it as an authoritative
  // "not found" would relabel a routing failure as a missing dialogue.
  it("rejects a 404 that is not the API's structured not_found", () => {
    const error = new DialogueDBError(
      "Not Found",
      "UNKNOWN_ERROR",
      "server_error",
      404
    );

    expect(isNotFoundError(error)).toBe(false);
  });

  it("rejects a not_found type on a non-404 status", () => {
    const error = new DialogueDBError("Gone", "GONE", "not_found", 410);

    expect(isNotFoundError(error)).toBe(false);
  });

  it("rejects a non-404 DialogueDBError", () => {
    const error = new DialogueDBError(
      "Internal server error",
      "INTERNAL_ERROR",
      "server_error",
      500
    );

    expect(isNotFoundError(error)).toBe(false);
  });

  it("rejects errors that are not DialogueDBErrors", () => {
    expect(isNotFoundError(new Error("Dialogue not found"))).toBe(false);
    expect(isNotFoundError({ statusCode: 404, type: "not_found" })).toBe(false);
    expect(isNotFoundError("not found")).toBe(false);
    expect(isNotFoundError(null)).toBe(false);
    expect(isNotFoundError(undefined)).toBe(false);
  });

  // Consumers catch what getDialogue throws, which is the re-wrapped error
  // rather than the API's own — the guard has to hold at either layer.
  it("matches the error the SDK re-wraps a miss into", () => {
    const cause = new DialogueDBError(
      "Dialogue 'abc' not found in namespace 'default'",
      "DIALOGUE_NOT_FOUND",
      "not_found",
      404,
      "req_123"
    );

    expect(
      isNotFoundError(errors.dialogueNotFound("abc", undefined, cause))
    ).toBe(true);
    expect(isNotFoundError(errors.dialogueNotFound("abc", "student-001"))).toBe(
      true
    );
  });
});

describe("errors factory", () => {
  describe("missingParameter", () => {
    it("creates DialogueDBError with correct properties", () => {
      const error = errors.missingParameter("userId");

      expect(error).toBeInstanceOf(DialogueDBError);
      expect(error.message).toBe("userId is required");
      expect(error.code).toBe("MISSING_PARAMETER");
      expect(error.type).toBe("validation_error");
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual([
        { field: "userId", code: "REQUIRED", message: "userId is required" },
      ]);
    });
  });

  describe("invalidParameter", () => {
    it("creates DialogueDBError with correct properties", () => {
      const error = errors.invalidParameter(
        "limit",
        "must be a positive integer",
        -5
      );

      expect(error).toBeInstanceOf(DialogueDBError);
      expect(error.message).toBe("Invalid limit: must be a positive integer");
      expect(error.code).toBe("INVALID_PARAMETER");
      expect(error.type).toBe("validation_error");
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual([
        {
          field: "limit",
          code: "INVALID",
          message: "must be a positive integer",
          value: -5,
        },
      ]);
    });

    it("works without value parameter", () => {
      const error = errors.invalidParameter("tags", "must be an array");

      expect(error.details).toEqual([
        {
          field: "tags",
          code: "INVALID",
          message: "must be an array",
          value: undefined,
        },
      ]);
    });
  });

  describe("validationError", () => {
    it("creates DialogueDBError with message only", () => {
      const error = errors.validationError(
        "Multiple validation errors occurred"
      );

      expect(error).toBeInstanceOf(DialogueDBError);
      expect(error.message).toBe("Multiple validation errors occurred");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.type).toBe("validation_error");
      expect(error.statusCode).toBe(400);
      expect(error.details).toBeUndefined();
    });

    it("creates DialogueDBError with details", () => {
      const details = [
        {
          field: "email",
          code: "INVALID_FORMAT",
          message: "Invalid email format",
        },
        {
          field: "age",
          code: "OUT_OF_RANGE",
          message: "Must be between 0 and 150",
          value: 200,
        },
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
      expect(error.type).toBe("server_error");
      expect(error.statusCode).toBe(501);
    });
  });
});
