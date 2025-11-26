import { create } from "@/api/memory";
import { useSettings } from "@/settings/useSettings";
import { SettingsOrContainer } from "@/settings/class.SettingsContainer";
import { CreateMemoryInput } from "@/types";
import { Memory } from "@/dialogue/class.memory";

/**
 * Create a new memory
 */
export async function createMemory(
  input: CreateMemoryInput,
  config?: SettingsOrContainer
): Promise<Memory> {
  const settings = useSettings(config);
  const data = await create(input, settings);
  return new Memory(data, settings);
}
