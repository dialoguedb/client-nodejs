import { Agent } from "https";
import fetch, { RequestInit, Response } from "node-fetch";
import pRetry from "p-retry";
import { version } from "../../package.json";

// Create a single instance of the https.Agent for connection pooling
const httpsAgent = new Agent({
  keepAlive: true,
});

/**
 * Error types matching the DialogueDB API error responses
 */
export type ErrorType =
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMIT"
  | "SERVER";

/**
 * Structured error class for DialogueDB API errors.
 * Parses and exposes error details from the API response.
 */
export class DialogueDBError extends Error {
  constructor(
    message: string,
    public code: string,
    public type: ErrorType,
    public statusCode: number,
    public requestId?: string,
    public details?: Array<{
      field?: string;
      code: string;
      message: string;
      value?: any;
    }>
  ) {
    super(message);
    this.name = "DialogueDBError";
  }

  /**
   * Whether this error is likely transient and the request could be retried.
   * True for rate limits (429) and server errors (5xx).
   */
  get retryable(): boolean {
    return this.statusCode === 429 || this.statusCode >= 500;
  }
}

/**
 * Makes an API request with the given URL and options, using a persistent HTTPS agent.
 *
 * @param url - The endpoint to which the request is sent.
 * @param options - Optional custom request options.
 * @returns The parsed JSON response wrapped in a Promise.
 * @throws {DialogueDBError} If the API returns an error response.
 */
export async function apiRequest<T extends Record<string, any> | null>(
  url: string,
  options?: Omit<RequestInit, "headers"> & {
    headers: Record<string, any> | Headers;
    params?: URLSearchParams;
  }
): Promise<T> {
  const { params, headers = {}, ...restOfOptions } = options ?? {};

  // Convert Headers instance to plain object if needed
  const headersObj =
    headers instanceof Headers
      ? Object.fromEntries(headers.entries())
      : headers;

  const finalHeaders = {
    ...headersObj,
    "User-Agent": `dialogue-db-nodejs.${version}`,
  };

  const finalOptions = {
    ...restOfOptions,
    headers: finalHeaders,
    agent: httpsAgent,
  };

  const queryString = params?.toString();
  const urlWithParams = params && queryString ? url + "?" + queryString : url;

  let response: Response;
  try {
    response = await fetch(urlWithParams, finalOptions);
  } catch (error: unknown) {
    // Network error (DNS failure, connection refused, timeout, etc.)
    const message = error instanceof Error ? error.message : "Network error";
    throw new DialogueDBError(message, "NETWORK_ERROR", "SERVER", 0);
  }

  if (!response.ok) {
    // Try to parse structured error response from API
    let body: any = {};
    try {
      body = await response.json();
    } catch {
      // Response wasn't JSON, use status text
    }

    const err = body?.error ?? {};

    throw new DialogueDBError(
      err.message ?? response.statusText ?? "Request failed",
      err.code ?? "UNKNOWN_ERROR",
      err.type ?? "SERVER",
      response.status,
      err.requestId,
      err.details
    );
  }

  return (await response.json()) as T;
}

/**
 * Options for configuring retry behavior
 */
export interface RetryOptions {
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Minimum timeout between retries in ms (default: 1000) */
  minTimeout?: number;
  /** Maximum timeout between retries in ms (default: 10000) */
  maxTimeout?: number;
}

/**
 * Wraps an async function with automatic retry logic for transient errors.
 * Only retries on errors where `retryable` is true (rate limits and server errors).
 *
 * @param fn - The async function to execute with retries
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws {DialogueDBError} If all retries fail or error is not retryable
 *
 * @example
 * const dialogue = await withRetry(
 *   () => dialogueApi.get(id, settings),
 *   { retries: 3 }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { retries = 3, minTimeout = 1000, maxTimeout = 10000 } = options;

  return pRetry(fn, {
    retries,
    minTimeout,
    maxTimeout,
    onFailedAttempt: (error) => {
      // Only retry if the error is marked as retryable
      if (error instanceof DialogueDBError && !error.retryable) {
        throw error; // Abort retries
      }
    },
  });
}
