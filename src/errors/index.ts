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
 * Whether an error is the API's "resource does not exist" response.
 * Exported so callers can distinguish a missing resource from a real failure
 * without matching on error messages.
 *
 * Both the status and the type are required: a 404 raised by the gateway rather
 * than the API carries no structured body, so it arrives as `server_error` and
 * must stay an error rather than being read as an authoritative "not found".
 */
export function isNotFoundError(error: unknown): error is DialogueDBError {
  return (
    error instanceof DialogueDBError &&
    error.statusCode === 404 &&
    error.type === "not_found"
  );
}

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

  /**
   * Creates the error for a dialogue that could not be resolved.
   *
   * A dialogue's namespace is part of its storage key, so the API resolves an
   * omitted namespace to its default rather than searching across namespaces.
   * An unscoped miss therefore cannot distinguish "does not exist" from "exists
   * under a namespace", and the hint is the only actionable signal we can give.
   *
   * `cause` is the API's own 404, when there was one; its requestId and details
   * are carried through so the error stays traceable in support requests.
   *
   * Truthiness rather than a null check, to match the request layer: it only
   * sends the namespace when it is non-empty, so an empty one was a default
   * lookup and still needs the hint.
   */
  dialogueNotFound: (
    id: string,
    namespace: string | undefined,
    cause?: DialogueDBError
  ): DialogueDBError => {
    const scope = namespace
      ? `namespace '${namespace}'`
      : "the default namespace";
    const hint = namespace
      ? ""
      : `. If it was created with a namespace, pass it: getDialogue("${id}", { namespace })`;

    return new DialogueDBError(
      `Dialogue '${id}' not found in ${scope}${hint}`,
      cause?.code ?? "DIALOGUE_NOT_FOUND",
      cause?.type ?? "not_found",
      cause?.statusCode ?? 404,
      cause?.requestId,
      cause?.details
    );
  },
};
