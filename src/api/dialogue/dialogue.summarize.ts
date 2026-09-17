import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { ISummary, SummarizeInput } from "@/types";
import { getConfig } from "@/settings";

/**
 * Kick off summarization of a dialogue. Maps to `POST /summary`, which takes
 * `dialogueId` in the body (the resource is top-level, not nested under the
 * dialogue). Returns the created summary, initially `status: "processing"`.
 */
export async function summarize(
  input: SummarizeInput,
  settings: SettingsContainer = getConfig()
) {
  if (!input?.dialogueId) {
    throw new Error("dialogueId is required");
  }

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.getApiUrl();
  headers.set("Authorization", `Bearer ${apiKey}`);

  const body = {
    dialogueId: input.dialogueId,
    ...(input.namespace !== undefined && { namespace: input.namespace }),
    ...(input.template !== undefined && { template: input.template }),
    ...(input.id !== undefined && { id: input.id }),
    ...(input.startId !== undefined && { startId: input.startId }),
    ...(input.endId !== undefined && { endId: input.endId }),
  };

  return apiRequest<ISummary>(
    `${endpoint}/summary`,
    {
      method: "post",
      headers,
      body: JSON.stringify(body),
    },
    settings.getRetryConfig()
  );
}
