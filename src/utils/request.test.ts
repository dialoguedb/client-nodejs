import { apiRequest, DialogueDBError } from "./request";
import fetch, { Response } from "node-fetch";

jest.mock("node-fetch", () => jest.fn());

describe("apiRequest", () => {
  const fetchMock = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("should return data when response is ok", async () => {
    const mockResponseData = { key: "value" };
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponseData),
    } as unknown as Response;

    fetchMock.mockResolvedValueOnce(mockResponse);

    const result = await apiRequest<typeof mockResponseData>(
      "https://api.example.com",
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    expect(result).toEqual(mockResponseData);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          "User-Agent": expect.stringMatching(/^dialogue-db-nodejs\./),
        },
        agent: expect.any(Object),
      })
    );
  });

  it("should throw DialogueDBError when response is not ok", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: jest.fn().mockResolvedValue({
        error: {
          code: "DIALOGUE_NOT_FOUND",
          type: "NOT_FOUND",
          message: "Dialogue not found",
          requestId: "req-123",
        },
      }),
    } as unknown as Response;

    fetchMock.mockResolvedValueOnce(mockResponse);

    try {
      await apiRequest("https://api.example.com", {
        headers: { "Content-Type": "application/json" },
      });
      fail("Expected error to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(DialogueDBError);
      const dbError = error as DialogueDBError;
      expect(dbError.code).toBe("DIALOGUE_NOT_FOUND");
      expect(dbError.type).toBe("NOT_FOUND");
      expect(dbError.statusCode).toBe(404);
      expect(dbError.message).toBe("Dialogue not found");
      expect(dbError.requestId).toBe("req-123");
      expect(dbError.retryable).toBe(false);
    }
  });

  it("should throw DialogueDBError with retryable=true for 5xx errors", async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: jest.fn().mockResolvedValue({
        error: {
          code: "INTERNAL_ERROR",
          type: "SERVER",
          message: "Something went wrong",
        },
      }),
    } as unknown as Response;

    fetchMock.mockResolvedValueOnce(mockResponse);

    try {
      await apiRequest("https://api.example.com", {
        headers: { "Content-Type": "application/json" },
      });
      fail("Expected error to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(DialogueDBError);
      const dbError = error as DialogueDBError;
      expect(dbError.statusCode).toBe(500);
      expect(dbError.retryable).toBe(true);
    }
  });

  it("should throw DialogueDBError with retryable=true for 429 errors", async () => {
    const mockResponse = {
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      json: jest.fn().mockResolvedValue({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          type: "RATE_LIMIT",
          message: "Rate limit exceeded",
        },
      }),
    } as unknown as Response;

    fetchMock.mockResolvedValueOnce(mockResponse);

    try {
      await apiRequest("https://api.example.com", {
        headers: { "Content-Type": "application/json" },
      });
      fail("Expected error to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(DialogueDBError);
      const dbError = error as DialogueDBError;
      expect(dbError.statusCode).toBe(429);
      expect(dbError.retryable).toBe(true);
    }
  });

  it("should throw DialogueDBError for network failures", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Connection refused"));

    try {
      await apiRequest("https://api.example.com", {
        headers: { "Content-Type": "application/json" },
      });
      fail("Expected error to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(DialogueDBError);
      const dbError = error as DialogueDBError;
      expect(dbError.code).toBe("NETWORK_ERROR");
      expect(dbError.type).toBe("SERVER");
      expect(dbError.statusCode).toBe(0);
      expect(dbError.message).toBe("Connection refused");
      expect(dbError.retryable).toBe(true); // Network errors are retryable
    }
  });

  it("should handle non-JSON error responses gracefully", async () => {
    const mockResponse = {
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as Response;

    fetchMock.mockResolvedValueOnce(mockResponse);

    try {
      await apiRequest("https://api.example.com", {
        headers: { "Content-Type": "application/json" },
      });
      fail("Expected error to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(DialogueDBError);
      const dbError = error as DialogueDBError;
      expect(dbError.statusCode).toBe(502);
      expect(dbError.code).toBe("UNKNOWN_ERROR");
      expect(dbError.message).toBe("Bad Gateway");
    }
  });

  it("should correctly pass headers when using Headers instance", async () => {
    const mockResponseData = { success: true };
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponseData),
    } as unknown as Response;

    fetchMock.mockResolvedValueOnce(mockResponse);

    const headers = new Headers();
    headers.set("Authorization", "Bearer my-api-key");
    headers.set("Content-Type", "application/json");

    await apiRequest("https://api.example.com/dialogue", {
      method: "POST",
      headers,
      body: JSON.stringify({ id: "test" }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/dialogue",
      expect.objectContaining({
        method: "POST",
        headers: {
          authorization: "Bearer my-api-key",
          "content-type": "application/json",
          "User-Agent": expect.stringMatching(/^dialogue-db-nodejs\./),
        },
        body: JSON.stringify({ id: "test" }),
      })
    );
  });

  describe("retry behavior", () => {
    it("retries on network errors", async () => {
      const mockResponseData = { success: true };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponseData),
      } as unknown as Response;

      // First call fails with network error, second succeeds
      fetchMock
        .mockRejectedValueOnce(new Error("Connection refused"))
        .mockResolvedValueOnce(mockResponse);

      const result = await apiRequest(
        "https://api.example.com",
        { headers: {} },
        { retries: 3, retryMinTimeout: 10, retryMaxTimeout: 100 }
      );

      expect(result).toEqual(mockResponseData);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("retries on 429 rate limit errors", async () => {
      const mockResponseData = { success: true };
      const mockSuccessResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponseData),
      } as unknown as Response;

      const mock429Response = {
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        json: jest.fn().mockResolvedValue({
          error: {
            code: "RATE_LIMIT",
            type: "RATE_LIMIT",
            message: "Rate limited",
          },
        }),
      } as unknown as Response;

      // First call returns 429, second succeeds
      fetchMock
        .mockResolvedValueOnce(mock429Response)
        .mockResolvedValueOnce(mockSuccessResponse);

      const result = await apiRequest(
        "https://api.example.com",
        { headers: {} },
        { retries: 3, retryMinTimeout: 10, retryMaxTimeout: 100 }
      );

      expect(result).toEqual(mockResponseData);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("retries on 5xx server errors", async () => {
      const mockResponseData = { success: true };
      const mockSuccessResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponseData),
      } as unknown as Response;

      const mock500Response = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: jest.fn().mockResolvedValue({
          error: {
            code: "SERVER_ERROR",
            type: "SERVER",
            message: "Internal error",
          },
        }),
      } as unknown as Response;

      fetchMock
        .mockResolvedValueOnce(mock500Response)
        .mockResolvedValueOnce(mockSuccessResponse);

      const result = await apiRequest(
        "https://api.example.com",
        { headers: {} },
        { retries: 3, retryMinTimeout: 10, retryMaxTimeout: 100 }
      );

      expect(result).toEqual(mockResponseData);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("does NOT retry on non-retryable errors (4xx)", async () => {
      const mock400Response = {
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: jest.fn().mockResolvedValue({
          error: {
            code: "VALIDATION_ERROR",
            type: "VALIDATION",
            message: "Invalid input",
          },
        }),
      } as unknown as Response;

      fetchMock.mockResolvedValueOnce(mock400Response);

      await expect(
        apiRequest(
          "https://api.example.com",
          { headers: {} },
          { retries: 3, retryMinTimeout: 10, retryMaxTimeout: 100 }
        )
      ).rejects.toThrow("Invalid input");

      // Should only be called once - no retry for 400 errors
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does NOT retry on 404 errors", async () => {
      const mock404Response = {
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: jest.fn().mockResolvedValue({
          error: {
            code: "NOT_FOUND",
            type: "NOT_FOUND",
            message: "Resource not found",
          },
        }),
      } as unknown as Response;

      fetchMock.mockResolvedValueOnce(mock404Response);

      await expect(
        apiRequest(
          "https://api.example.com",
          { headers: {} },
          { retries: 3, retryMinTimeout: 10, retryMaxTimeout: 100 }
        )
      ).rejects.toThrow("Resource not found");

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not retry when retries config is 0", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        apiRequest(
          "https://api.example.com",
          { headers: {} },
          { retries: 0, retryMinTimeout: 10, retryMaxTimeout: 100 }
        )
      ).rejects.toThrow("Network error");

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not retry when no retry config provided", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        apiRequest("https://api.example.com", { headers: {} })
      ).rejects.toThrow("Network error");

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("edge cases", () => {
    it("should handle undefined options gracefully", async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      } as unknown as Response;
      fetchMock.mockResolvedValueOnce(mockResponse);

      const result = await apiRequest("https://api.example.com");

      expect(result).toEqual({ success: true });
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com",
        expect.objectContaining({
          headers: expect.objectContaining({
            "User-Agent": expect.stringMatching(/^dialogue-db-nodejs\./),
          }),
        })
      );
    });

    it("should append params to URL as query string", async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ items: [] }),
      } as unknown as Response;
      fetchMock.mockResolvedValueOnce(mockResponse);

      const params = new URLSearchParams();
      params.set("limit", "10");
      params.set("cursor", "abc123");

      await apiRequest("https://api.example.com/list", {
        headers: {},
        params,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/list?limit=10&cursor=abc123",
        expect.any(Object)
      );
    });

    it("should NOT append ? when params is undefined", async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ items: [] }),
      } as unknown as Response;
      fetchMock.mockResolvedValueOnce(mockResponse);

      await apiRequest("https://api.example.com/list", {
        headers: {},
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/list",
        expect.any(Object)
      );
    });

    it("should NOT append ? when params is empty", async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ items: [] }),
      } as unknown as Response;
      fetchMock.mockResolvedValueOnce(mockResponse);

      const params = new URLSearchParams();

      await apiRequest("https://api.example.com/list", {
        headers: {},
        params,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/list",
        expect.any(Object)
      );
    });

    it("should handle error response with no error object", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Response;
      fetchMock.mockResolvedValueOnce(mockResponse);

      await expect(
        apiRequest("https://api.example.com", { headers: {} })
      ).rejects.toMatchObject({
        message: "Internal Server Error",
        code: "UNKNOWN_ERROR",
        type: "SERVER",
        statusCode: 500,
      });
    });

    it("should handle error response with partial error object", async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: jest.fn().mockResolvedValue({
          error: {
            message: "Validation failed",
          },
        }),
      } as unknown as Response;
      fetchMock.mockResolvedValueOnce(mockResponse);

      await expect(
        apiRequest("https://api.example.com", { headers: {} })
      ).rejects.toMatchObject({
        message: "Validation failed",
        code: "UNKNOWN_ERROR",
        type: "SERVER",
        statusCode: 400,
        requestId: undefined,
        details: undefined,
      });
    });

    it("should handle error response with null error", async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: jest.fn().mockResolvedValue({ error: null }),
      } as unknown as Response;
      fetchMock.mockResolvedValueOnce(mockResponse);

      await expect(
        apiRequest("https://api.example.com", { headers: {} })
      ).rejects.toMatchObject({
        message: "Forbidden",
        code: "UNKNOWN_ERROR",
        type: "SERVER",
      });
    });

    it("should fall back to 'Request failed' when statusText is empty", async () => {
      const mockResponse = {
        ok: false,
        status: 418,
        statusText: "",
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Response;
      fetchMock.mockResolvedValueOnce(mockResponse);

      await expect(
        apiRequest("https://api.example.com", { headers: {} })
      ).rejects.toMatchObject({
        message: "Request failed",
        code: "UNKNOWN_ERROR",
        type: "SERVER",
      });
    });
  });
});
