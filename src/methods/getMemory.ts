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
  const data = await get(input, useSettings(config));
  return data ? new Memory(data, config) : null;
}
