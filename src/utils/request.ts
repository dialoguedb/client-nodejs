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
  | "validation_error"
  | "authentication_error"
  | "authorization_error"
  | "not_found"
  | "conflict"
  | "rate_limit_exceeded"
  | "server_error"
  | "service_unavailable";

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
   * True for network errors (0), rate limits (429), and server errors (5xx).
   */
  get retryable(): boolean {
    return (
      this.statusCode === 0 || this.statusCode === 429 || this.statusCode >= 500
    );
  }
}

export interface RetryConfig {
  retries: number;
  retryMinTimeout: number;
  retryMaxTimeout: number;
}

/**
 * Makes an API request with the given URL and options, using a persistent HTTPS agent.
 * Automatically retries on transient errors (network errors, 429, 5xx).
 *
 * @param url - The endpoint to which the request is sent.
 * @param options - Optional custom request options.
 * @param retry - Retry configuration from settings.
 * @returns The parsed JSON response wrapped in a Promise.
 * @throws {DialogueDBError} If the API returns an error response.
 */
export async function apiRequest<T extends Record<string, any> | null>(
  url: string,
  options?: Omit<RequestInit, "headers"> & {
    headers: Record<string, any> | Headers;
    params?: URLSearchParams;
  },
  retry?: RetryConfig
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

  const doRequest = async (): Promise<T> => {
    let response: Response;
    try {
      response = await fetch(urlWithParams, finalOptions);
    } catch (error: unknown) {
      // Network error (DNS failure, connection refused, timeout, etc.)
      const message = error instanceof Error ? error.message : "Network error";
      throw new DialogueDBError(message, "NETWORK_ERROR", "server_error", 0);
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
        err.message || response.statusText || "Request failed",
        err.code ?? "UNKNOWN_ERROR",
        err.type ?? "server_error",
        response.status,
        err.requestId,
        err.details
      );
    }

    return (await response.json()) as T;
  };

  // If no retry config or retries disabled, just run once
  if (!retry || retry.retries === 0) {
    return doRequest();
  }

  return pRetry(doRequest, {
    retries: retry.retries,
    minTimeout: retry.retryMinTimeout,
    maxTimeout: retry.retryMaxTimeout,
    onFailedAttempt: (error) => {
      // Only retry if the error is marked as retryable
      if (error instanceof DialogueDBError && !error.retryable) {
        throw error; // Abort retries
      }
    },
  });
}
