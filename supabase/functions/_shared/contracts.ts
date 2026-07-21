export type AiOperation = "analyze_stage" | "compare_learning" | "assist_user";

export type PaideiaAiRequest =
  | {
    operation: "analyze_stage";
    sessionId: string;
    stageRunId: string;
    idempotencyKey: string;
  }
  | {
    operation: "compare_learning";
    sessionId: string;
    initialStageRunId: string;
    transferStageRunId: string;
    idempotencyKey: string;
  }
  | {
    operation: "assist_user";
    sessionId: string;
    stageRunId: string;
    intent: "hint" | "rephrase" | "example" | "rewrite_instruction";
    responseId?: string;
    idempotencyKey: string;
  };

export type ModelCost = {
  input: number;
  output: number;
};

export type Snapshot<T> = {
  fetchedAt: number;
  data: T;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ASSIST_INTENTS = new Set([
  "hint",
  "rephrase",
  "example",
  "rewrite_instruction",
]);

function requiredString(value: unknown, name: string, maxLength = 200): string {
  if (
    typeof value !== "string" || value.length === 0 || value.length > maxLength
  ) {
    throw new Error(`INVALID_${name.toUpperCase()}`);
  }
  return value;
}

function requiredUuid(value: unknown, name: string): string {
  const parsed = requiredString(value, name, 36);
  if (!UUID_PATTERN.test(parsed)) {
    throw new Error(`INVALID_${name.toUpperCase()}`);
  }
  return parsed;
}

export function parsePaideiaAiRequest(value: unknown): PaideiaAiRequest {
  if (!value || typeof value !== "object") throw new Error("INVALID_REQUEST");
  const body = value as Record<string, unknown>;
  const sessionId = requiredUuid(body.sessionId, "session_id");
  const idempotencyKey = requiredString(body.idempotencyKey, "idempotency_key");

  if (body.operation === "analyze_stage") {
    return {
      operation: body.operation,
      sessionId,
      stageRunId: requiredUuid(body.stageRunId, "stage_run_id"),
      idempotencyKey,
    };
  }

  if (body.operation === "compare_learning") {
    return {
      operation: body.operation,
      sessionId,
      initialStageRunId: requiredUuid(
        body.initialStageRunId,
        "initial_stage_run_id",
      ),
      transferStageRunId: requiredUuid(
        body.transferStageRunId,
        "transfer_stage_run_id",
      ),
      idempotencyKey,
    };
  }

  if (body.operation === "assist_user") {
    if (!ASSIST_INTENTS.has(String(body.intent))) {
      throw new Error("INVALID_INTENT");
    }
    return {
      operation: body.operation,
      sessionId,
      stageRunId: requiredUuid(body.stageRunId, "stage_run_id"),
      intent: body.intent as
        | "hint"
        | "rephrase"
        | "example"
        | "rewrite_instruction",
      responseId: body.responseId == null
        ? undefined
        : requiredUuid(body.responseId, "response_id"),
      idempotencyKey,
    };
  }

  throw new Error("INVALID_OPERATION");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function containsHtml(value: unknown): boolean {
  if (typeof value === "string") return /<\/?[a-z][^>]*>/i.test(value);
  if (Array.isArray(value)) return value.some(containsHtml);
  return isRecord(value) && Object.values(value).some(containsHtml);
}

export function assertAiResult(operation: AiOperation, value: unknown): void {
  if (!isRecord(value) || containsHtml(value)) {
    throw new Error("INVALID_MODEL_RESULT");
  }

  const valid = operation === "analyze_stage"
    ? typeof value.summary === "string" && isRecord(value.participation) &&
      Array.isArray(value.patterns) &&
      Array.isArray(value.limitations) && isRecord(value.readiness) &&
      Array.isArray(value.options)
    : operation === "compare_learning"
    ? typeof value.summary === "string" &&
      Array.isArray(value.observedChanges) &&
      Array.isArray(value.persistentDifficulties) &&
      Array.isArray(value.limitations) && isRecord(value.recommendation)
    : typeof value.intent === "string" && typeof value.message === "string" &&
      typeof value.nextAction === "string" && typeof value.model === "string" &&
      value.isFreeModel === true;

  if (!valid) throw new Error("INVALID_MODEL_RESULT");
}
