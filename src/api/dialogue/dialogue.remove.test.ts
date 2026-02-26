import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest, DialogueDBError } from "@/utils/request";
import { remove } from "./dialogue.remove";

jest.mock("@/utils/request", () => ({
  apiRequest: jest.fn(),
  DialogueDBError: jest.requireActual("@/utils/request").DialogueDBError,
}));

describe("dialogue.remove", () => {
  const apiRequestMock = apiRequest as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should remove dialogue successfully", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";

    const input = {
      id: dialogueId,
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce(undefined);

    await remove(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/dialogue/${dialogueId}`,
      {
        method: "delete",
        headers: expect.any(Headers),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
  });

  it("should throw error for invalid input - missing id", async () => {
    const input = {} as any;

    await expect(remove(input)).rejects.toThrow("id is required");
    await expect(remove(input)).rejects.toBeInstanceOf(DialogueDBError);

    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("should set Authorization header correctly", async () => {
    const key = "test-api-key-123";
    const endpoint = "https://api.example.com";
    const input = {
      id: "dialogue-123",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce(undefined);

    await remove(input, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    const headers = callArgs[1].headers;

    expect(headers.get("Authorization")).toBe(`Bearer ${key}`);
  });

  it("should use correct endpoint path with id", async () => {
    const endpoint = "https://api.example.com";
    const input = {
      id: "dialogue-abc",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", "key");
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce(undefined);

    await remove(input, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    expect(callArgs[0]).toBe(`${endpoint}/dialogue/dialogue-abc`);
  });

  it("should handle API errors", async () => {
    const input = {
      id: "dialogue-123",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", "key");
    settings.set("endpoint", "https://api.example.com");

    const error = new Error("API Error: Dialogue not found");
    apiRequestMock.mockRejectedValueOnce(error);

    await expect(remove(input, settings)).rejects.toThrow(
      "API Error: Dialogue not found"
    );
  });
});
