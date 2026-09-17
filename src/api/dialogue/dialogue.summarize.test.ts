import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { summarize } from "./dialogue.summarize";

jest.mock("@/utils/request", () => ({
  apiRequest: jest.fn(),
  DialogueDBError: jest.requireActual("@/utils/request").DialogueDBError,
}));

describe("dialogue.summarize", () => {
  const apiRequestMock = apiRequest as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeSettings(endpoint = "https://api.example.com") {
    const settings = new SettingsContainer();
    settings.set("apiKey", "my-api-key");
    settings.set("endpoint", endpoint);
    return settings;
  }

  it("POSTs to /summary with dialogueId in the body", async () => {
    const endpoint = "https://api.example.com";
    apiRequestMock.mockResolvedValueOnce({ id: "sum-1", status: "processing" });

    const result = await summarize({ dialogueId: "dlg-1" }, makeSettings(endpoint));

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      `${endpoint}/api/v1/summary`,
      {
        method: "post",
        headers: expect.any(Headers),
        body: JSON.stringify({ dialogueId: "dlg-1" }),
      },
      { retries: 3, retryMinTimeout: 1000, retryMaxTimeout: 10000 }
    );
    expect(result).toEqual({ id: "sum-1", status: "processing" });
  });

  it("forwards template, namespace, and range when provided", async () => {
    apiRequestMock.mockResolvedValueOnce({ id: "sum-2", status: "processing" });

    await summarize(
      {
        dialogueId: "dlg-1",
        namespace: "ns-x",
        template: "decisions",
        startId: "m1",
        endId: "m2",
      },
      makeSettings()
    );

    const [, options] = apiRequestMock.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      dialogueId: "dlg-1",
      namespace: "ns-x",
      template: "decisions",
      startId: "m1",
      endId: "m2",
    });
  });

  it("throws without a dialogueId", async () => {
    await expect(summarize({ dialogueId: "" }, makeSettings())).rejects.toThrow(
      "dialogueId is required"
    );
    expect(apiRequestMock).not.toHaveBeenCalled();
  });
});
