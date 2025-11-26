import { get } from "@/api/memory";
import { useSettings } from "@/settings/useSettings";
import { SettingsOrContainer } from "@/settings/class.SettingsContainer";
import { GetMemoryInput } from "@/types";
import { Memory } from "@/dialogue/class.memory";

/**
 * Get a memory by key
 */
export async function getMemory(
  input: GetMemoryInput,
  config?: SettingsOrContainer
): Promise<Memory | null> {
  const settings = useSettings(config);
  const data = await get(input, settings);
  return data ? new Memory(data, settings) : null;
}
