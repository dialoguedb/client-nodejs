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
 * Re-raises a validation failure with the failing message's position in the
 * batch.
 *
 * A validation error for a single message identifies the offending content
 * part ("item 0: ..."), which is ambiguous once many messages are sent
 * together. Prefixing the message and each `details[].field` with
 * `messages[i]` names the message as the caller passed it, and matches the
 * field paths returned when the request is rejected remotely, so both can be
 * handled the same way.
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
  // dialogueId applies to the whole batch, so an invalid one is reported
  // against "dialogueId" rather than against messages[0].
  if (!input.id) {
    throw errors.missingParameter("dialogueId");
  }
  validateStringField(input.id, "dialogueId", 5);

  // Validate every message before sending: a batch with one malformed image
  // part fails here instead of after uploading the whole payload. dialogueId
  // is supplied once for the batch, so it is attached to each message for
  // validation.
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

  // Per-message limits are separate caps, not a shared budget, and a batch is
  // sent as a single request. Measure the serialized payload so the JSON
  // overhead counts toward the request size limit too.
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
