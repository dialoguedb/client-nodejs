import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest, DialogueDBError } from "@/utils/request";
import { getConfig } from "@/settings";
import { errors } from "@/errors";
import { CreateMessageInput, IMessage } from "@/types";
import {
  validateCreateMessageInput,
  assertBatchBodyFitsOneRequest,
} from "@/api/message/validate";
import { validateStringField } from "@/utils/validation";

/**
 * Re-raises a per-message validation failure with the batch index folded in.
 *
 * The single-create validator numbers content parts ("item 0: ..."), which
 * identifies the offending part in a message and says nothing about which
 * message. Across a batch every message has an item 0, so the unqualified
 * error points at all fifty at once. The API names the offending element
 * `messages[i].content`; matching that spelling means the local error and the
 * server error read the same way and can be handled the same way.
 */
function withBatchIndex(error: unknown, index: number): unknown {
  if (!(error instanceof DialogueDBError)) {
    return error;
  }
  return new DialogueDBError(
    `messages[${index}]: ${error.message}`,
    error.code,
    error.type,
    error.statusCode,
    error.requestId,
    error.details?.map((detail) =>
      detail.field === undefined
        ? detail
        : { ...detail, field: `messages[${index}].${detail.field}` }
    )
  );
}

export async function create(
  input: {
    id: string;
    namespace?: string;
    messages: Omit<CreateMessageInput, "dialogueId">[];
  },
  settings: SettingsContainer = getConfig()
) {
  // Checked once, up here, and not left to the per-message validator below.
  // dialogueId is a batch-level query parameter on this route, so a bad one is
  // not a fault in any particular message and must not be reported against
  // messages[0].
  if (!input.id) {
    throw errors.missingParameter("dialogueId");
  }
  validateStringField(input.id, "dialogueId", 5);

  // Validate before serializing: a 50-message batch with one broken image part
  // would otherwise upload every byte only to be rejected server-side. The
  // batch route takes dialogueId as a query param, so reattach it per message
  // to reuse the single-create validator unchanged.
  input.messages.forEach((message, index) => {
    try {
      validateCreateMessageInput({ ...message, dialogueId: input.id });
    } catch (error) {
      throw withBatchIndex(error, index);
    }
  });

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

  // The per-message validator above cannot see the batch: it checks each
  // message's inline images against the request ceiling independently, and this
  // route puts all of them in one body. Measured here, on the exact string about
  // to be sent, so the envelope is counted too.
  const body = JSON.stringify(input.messages);
  assertBatchBodyFitsOneRequest(body);

  const req = await apiRequest<IMessage[]>(
    url,
    {
      method: "post",
      headers,
      body,
    },
    settings.getRetryConfig()
  );

  return req;
}
