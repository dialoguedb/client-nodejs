import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { remove } from "./message.remove";

jest.mock("@/utils/request", () => ({
  apiRequest: jest.fn(),
}));

describe("message.remove", () => {
  const apiRequestMock = apiRequest as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should remove a message successfully", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const dialogueId = "dialogue-123";
    const messageId = "message-456";

    const input = {
      dialogueId,
      id: messageId,
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce(undefined);

    await remove(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/dialogue/${dialogueId}/messages/${messageId}`,
      {
        method: "delete",
        headers: expect.any(Headers),
      }
    );
  });

  it("should throw error for invalid input - missing dialogueId", async () => {
    const input = {
      id: "message-123",
    } as any;

    await expect(remove(input)).rejects.toThrow(
      "Missing required 'dialogueId'"
    );

    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("should throw error for invalid input - missing id", async () => {
    const input = {
      dialogueId: "dialogue-123",
    } as any;

    await expect(remove(input)).rejects.toThrow("Missing required 'id'");

    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("should set Authorization header correctly", async () => {
    const key = "test-api-key-123";
    const endpoint = "https://api.example.com";
    const input = {
      dialogueId: "dialogue-123",
      id: "message-456",
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
});
