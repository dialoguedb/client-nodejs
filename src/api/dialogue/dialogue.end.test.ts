import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { end } from "./dialogue.end";

jest.mock("@/utils/request", () => ({
  apiRequest: jest.fn(),
  DialogueDBError: jest.requireActual("@/utils/request").DialogueDBError,
}));

describe("dialogue.end", () => {
  const apiRequestMock = apiRequest as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call PUT /dialogue/{id}/end", async () => {
    const endpoint = "https://api.example.com";
    const input = { id: "dialogue-123" };

    const settings = new SettingsContainer();
    settings.set("apiKey", "my-api-key");
    settings.set("endpoint", endpoint);

    const mockResponse = {
      id: "dialogue-123",
      status: "ended",
      endedAt: "2025-01-15T12:00:00Z",
    };
    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await end(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/dialogue/dialogue-123/end`,
      {
        method: "put",
        headers: expect.any(Headers),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
    expect(result).toEqual(mockResponse);
  });

  it("should throw error for missing id", async () => {
    await expect(end({} as any)).rejects.toThrow("id is required");
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("should set Authorization header correctly", async () => {
    const key = "test-api-key-123";
    const endpoint = "https://api.example.com";

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({});

    await end({ id: "dialogue-123" }, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    const headers = callArgs[1].headers;
    expect(headers.get("Authorization")).toBe(`Bearer ${key}`);
  });

  it("should handle API errors", async () => {
    const settings = new SettingsContainer();
    settings.set("apiKey", "key");
    settings.set("endpoint", "https://api.example.com");

    const error = new Error("Dialogue not found");
    apiRequestMock.mockRejectedValueOnce(error);

    await expect(end({ id: "dialogue-123" }, settings)).rejects.toThrow(
      "Dialogue not found"
    );
  });
});
