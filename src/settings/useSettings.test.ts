import { SettingsContainer } from "./class.SettingsContainer";
import { useSettings } from "./useSettings";
import * as createConfig from "./createConfig";
import * as getConfig from "@/settings";

describe("useSettings", () => {
  const createConfigSpy = jest.spyOn(createConfig, "createConfig");
  const getConfigSpy = jest.spyOn(getConfig, "getConfig");

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("will return instanceof SettingsContainer", async () => {
    const mockSettings = new SettingsContainer();
    getConfigSpy.mockReturnValueOnce(mockSettings);
    const settings = useSettings();
    expect(createConfigSpy).toHaveBeenCalledTimes(0);
    expect(getConfigSpy).toHaveBeenCalledTimes(1);
    expect(settings).toBeInstanceOf(SettingsContainer);
  });

  it("will use SettingsContainer if provided", async () => {
    const container = new SettingsContainer();
    const settings = useSettings(container);
    expect(createConfigSpy).toHaveBeenCalledTimes(0);
    expect(getConfigSpy).toHaveBeenCalledTimes(0);
    expect(settings).toBeInstanceOf(SettingsContainer);
  });

  it("will use createConfigSpy if Settings provided", async () => {
    const mockSettings = new SettingsContainer();
    createConfigSpy.mockReturnValueOnce(mockSettings);
    const settings = useSettings({
      apiKey: "",
      endpoint: "",
    });
    expect(createConfigSpy).toHaveBeenCalledTimes(1);
    expect(getConfigSpy).toHaveBeenCalledTimes(0);
    expect(settings).toBeInstanceOf(SettingsContainer);
  });

  it("will use getConfigSpy if empty Settings provided", async () => {
    const mockSettings = new SettingsContainer();
    getConfigSpy.mockReturnValueOnce(mockSettings);
    const settings = useSettings({});
    expect(createConfigSpy).toHaveBeenCalledTimes(0);
    expect(getConfigSpy).toHaveBeenCalledTimes(1);
    expect(settings).toBeInstanceOf(SettingsContainer);
  });
});
