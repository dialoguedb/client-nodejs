import { DialogueDBError } from "@/utils/request";

// Re-export for convenience
export { DialogueDBError } from "@/utils/request";
export type { ErrorType } from "@/utils/request";

type ErrorDetail = {
  field?: string;
  code: string;
  message: string;
  value?: unknown;
};

/**
 * Factory functions for creating consistent validation errors.
 * These match the structure of server-side errors so developers
 * get the same error experience whether validation fails client-side or server-side.
 */
export const errors = {
  /**
   * Creates an error for a required parameter that was not provided.
   */
  missingParameter: (param: string): DialogueDBError =>
    new DialogueDBError(
      `${param} is required`,
      "MISSING_PARAMETER",
      "validation_error",
      400,
      undefined,
      [{ field: param, code: "REQUIRED", message: `${param} is required` }]
    ),

  /**
   * Creates an error for a parameter with an invalid type, format, or value.
   */
  invalidParameter: (
    param: string,
    reason: string,
    value?: unknown
  ): DialogueDBError =>
    new DialogueDBError(
      `Invalid ${param}: ${reason}`,
      "INVALID_PARAMETER",
      "validation_error",
      400,
      undefined,
      [{ field: param, code: "INVALID", message: reason, value }]
    ),

  /**
   * Creates a general validation error, optionally with multiple field details.
   */
  validationError: (
    message: string,
    details?: ErrorDetail[]
  ): DialogueDBError =>
    new DialogueDBError(
      message,
      "VALIDATION_ERROR",
      "validation_error",
      400,
      undefined,
      details
    ),

  /**
   * Creates an error for methods that are not yet implemented.
   */
  notImplemented: (method: string): DialogueDBError =>
    new DialogueDBError(
      `${method}() is not yet implemented`,
      "NOT_IMPLEMENTED",
      "server_error",
      501
    ),
};
