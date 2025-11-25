import { apiRequest, DialogueDBError } from "./request";
import fetch, { Response } from "node-fetch";

jest.mock("node-fetch", () => jest.fn());

describe("apiRequest", () => {
  const fetchMock = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock.mockClear();
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
          "User-Agent": "dialogue-db-nodejs.0.0.1",
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
});
