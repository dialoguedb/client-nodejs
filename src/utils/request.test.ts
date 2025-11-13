import { apiRequest } from "./request";
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
          "User-Agent": "dialogue-db-nodejs.0.0.1"
        },
        agent: expect.any(Object),
      })
    );
  });

  it("should throw an error when response is not ok", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      text: jest.fn().mockResolvedValue("Not Found"),
    } as unknown as Response;

    fetchMock.mockResolvedValueOnce(mockResponse);

    await expect(
      apiRequest("https://api.example.com", {
        headers: { "Content-Type": "application/json" },
      })
    ).rejects.toThrow("Request to https://api.example.com failed: Not Found");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "dialogue-db-nodejs.0.0.1"
        },
        agent: expect.any(Object),
      })
    );
  });

  it("should throw an error when fetch fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    await expect(
      apiRequest("https://api.example.com", {
        headers: { "Content-Type": "application/json" },
      })
    ).rejects.toThrow(
      "Request to https://api.example.com failed: Network error"
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "dialogue-db-nodejs.0.0.1"
        },
        agent: expect.any(Object),
      })
    );
  });
});
