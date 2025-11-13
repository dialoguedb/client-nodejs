import { list } from "@/api/dialogue";
import { useSettings } from "@/settings/useSettings";
import {
  Settings,
  SettingsContainer,
} from "@/settings/class.SettingsContainer";
import { ListDialogueFilters } from "@/types";

/**
 * Dialogue - List Dialogues
 *
 *
 *
 * @param filters Filter results - options: order, limit, date
 * @param config Settings configuration
 * @returns
 */
export async function listDialogues(
  filters: ListDialogueFilters = {},
  config?: SettingsContainer | Settings
) {
  return list(filters, useSettings(config));
}
