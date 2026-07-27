import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { CreateMessageInput, IMessage } from "@/types";
import { validateCreateMessageInput } from "@/api/message/validate";

export async function create(
  input: {
    id: string;
    namespace?: string;
    messages: Omit<CreateMessageInput, "dialogueId">[];
  },
  settings: SettingsContainer = getConfig()
) {
  // Validate before serializing: a 50-message batch with one broken image part
  // would otherwise upload every byte only to be rejected server-side. The
  // batch route takes dialogueId as a query param, so reattach it per message
  // to reuse the single-create validator unchanged.
  for (const message of input.messages) {
    validateCreateMessageInput({ ...message, dialogueId: input.id });
  }

  const headers = new Headers();
  const apiKey = settings.get("apiKey");
  const endpoint = settings.getApiUrl();
  headers.set("Authorization", `Bearer ${apiKey}`);

  const params = new URLSearchParams();
  params.set("dialogueId", input.id);
  if (input.namespace) {
    params.set("namespace", input.namespace);
  }
  const url = `${endpoint}/messages?${params.toString()}`;

  const req = await apiRequest<IMessage[]>(
    url,
    {
      method: "post",
      headers,
      body: JSON.stringify(input.messages),
    },
    settings.getRetryConfig()
  );

  return req;
}
