import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { create } from "./memory.create";

jest.mock("@/utils/request", () => ({
  apiRequest: jest.fn(),
}));

describe("memory.create", () => {
  const apiRequestMock = apiRequest as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create memory successfully", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const input = {
      key: "user-preferences",
      value: { theme: "dark", language: "en" },
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      key: "user-preferences",
      value: { theme: "dark", language: "en" },
      created: "2024-01-01T00:00:00.000Z",
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await create(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(`${endpoint}/memory`, {
      method: "post",
      headers: expect.any(Headers),
      body: JSON.stringify(input),
    });

    expect(result).toEqual(mockResponse);
  });

  it("should create memory with string value", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const input = {
      key: "last-seen",
      value: "2024-01-01",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      ...input,
      created: "2024-01-01T00:00:00.000Z",
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await create(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockResponse);
  });

  it("should set Authorization header correctly", async () => {
    const key = "test-api-key-123";
    const endpoint = "https://api.example.com";
    const input = {
      key: "test-key",
      value: "test-value",
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    apiRequestMock.mockResolvedValueOnce({});

    await create(input, settings);

    const callArgs = apiRequestMock.mock.calls[0];
    const headers = callArgs[1].headers;

    expect(headers.get("Authorization")).toBe(`Bearer ${key}`);
  });

  it("should create memory with complex nested object", async () => {
    const key = "my-api-key";
    const endpoint = "https://api.example.com";
    const input = {
      key: "complex-data",
      value: {
        nested: {
          array: [1, 2, 3],
          object: { foo: "bar" },
        },
      },
    };

    const settings = new SettingsContainer();
    settings.set("apiKey", key);
    settings.set("endpoint", endpoint);

    const mockResponse = {
      ...input,
      created: "2024-01-01T00:00:00.000Z",
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await create(input, settings);

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const callArgs = apiRequestMock.mock.calls[0];
    const bodyArg = JSON.parse(callArgs[1].body);

    expect(bodyArg.key).toBe("complex-data");
    expect(bodyArg.value).toEqual(input.value);
    expect(result).toEqual(mockResponse);
  });
});
