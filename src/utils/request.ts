import { Agent } from "https";
import fetch, { RequestInit, Response } from "node-fetch";
import { version } from "../../package.json";

// Create a single instance of the https.Agent
const httpsAgent = new Agent({
  keepAlive: true,
});

/**
 * Makes an API request with the given URL and options, using a persistent HTTPS agent.
 *
 * @param {string} url - The endpoint to which the request is sent.
 * @param {RequestInit} [options] - Optional custom request options.
 * @returns {Promise<T>} The parsed JSON response wrapped in a Promise.
 * @throws Will throw an error if the HTTP request fails.
 */
export async function apiRequest<T extends Record<string, any> | null>(
  url: string,
  options?: Omit<RequestInit, "headers"> & {
    headers: Record<string, any>;
    params?: URLSearchParams;
  }
): Promise<T> {
  const { params, ...restOfOptions } = options ?? {};

  // Ensure the agent is used for this request
  const finalOptions = {
    ...restOfOptions,
    agent: httpsAgent,
  };

  (finalOptions.headers ??= {})["User-Agent"] = `dialogue-db-nodejs.${version}`;

  try {
    const queryString = params?.toString();

    const urlWithParams = params && queryString ? url + "?" + queryString : url;

    const response: Response = await fetch(urlWithParams, finalOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }
    const responseData = await response.json();
    return responseData as T;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    throw new Error(`Request to ${url} failed: ${message}`);
  }
}
