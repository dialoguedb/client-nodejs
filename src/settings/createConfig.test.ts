import { SettingsContainer } from "./class.SettingsContainer";
import { createConfig } from "./createConfig";

describe("createConfig", () => {
  it("will create if not given id", async () => {
    const settings = createConfig();
    expect(settings).toBeInstanceOf(SettingsContainer);
  });
});
