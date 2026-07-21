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
const SAFE_POSTGREST_MESSAGES = new Set([
  "AUTH_REQUIRED",
  "MEMBER_REQUIRED",
  "TEACHER_REQUIRED",
  "SESSION_NOT_ACTIVE",
  "STAGE_NOT_FOUND",
  "FREE_MODEL_REQUIRED",
  "INVALID_AI_RESERVATION",
  "INVALID_AI_VISIBILITY",
  "COLLECTIVE_AI_NOT_AUTHORIZED",
  "FREE_AI_CONSENT_REQUIRED",
  "RATE_LIMIT_ASSIST_EXCEEDED",
  "RATE_LIMIT_ANALYZE_EXCEEDED",
]);
const AUTHENTICATION_ERROR_CODES = new Set([
  "INVALID_JWT",
  "MISSING_AUTH_HEADER",
  "INVALID_AUTH_HEADER_FORMAT",
  "AUTH_REQUIRED",
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

export function safePostgrestErrorCode(
  value: unknown,
  status: number,
): string {
  if (
    isRecord(value) && value.code === "P0001" &&
    typeof value.message === "string" &&
    SAFE_POSTGREST_MESSAGES.has(value.message)
  ) return value.message;
  return `DATABASE_REQUEST_FAILED_${status}`;
}

export function statusForError(errorCode: string): number {
  if (AUTHENTICATION_ERROR_CODES.has(errorCode)) return 401;
  if (errorCode.startsWith("RATE_LIMIT_")) return 429;
  if (errorCode === "FREE_MODEL_UNAVAILABLE") return 503;
  if (
    errorCode.endsWith("_REQUIRED") || errorCode.endsWith("_AUTHORIZED")
  ) return 403;
  return 400;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function invalidResult(): never {
  throw new Error("INVALID_MODEL_RESULT");
}

function resultString(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || /[<>]/.test(value)) {
    invalidResult();
  }
  return value;
}

function resultRecord(
  value: unknown,
  allowedKeys?: readonly string[],
): Record<string, unknown> {
  if (!isRecord(value)) invalidResult();
  if (
    allowedKeys && Object.keys(value).some((key) => !allowedKeys.includes(key))
  ) invalidResult();
  return value;
}

function resultArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) invalidResult();
  return value;
}

function stringArray(value: unknown, aliases?: Set<string>): void {
  for (const entry of resultArray(value)) {
    const parsed = resultString(entry);
    if (aliases && !aliases.has(parsed)) invalidResult();
  }
}

function assertThreeColumnActivity(value: unknown): void {
  const activity = resultRecord(value, [
    "type",
    "title",
    "prompt",
    "columns",
  ]);
  if (activity.type !== "three_column") invalidResult();
  resultString(activity.title);
  resultString(activity.prompt);
  const columns = resultArray(activity.columns);
  const keys = ["said", "intended", "effect"];
  if (columns.length !== keys.length) invalidResult();
  columns.forEach((column, index) => {
    const parsed = resultRecord(column, ["key", "label"]);
    if (parsed.key !== keys[index]) invalidResult();
    resultString(parsed.label);
  });
}

function assertStageAnalysis(
  value: Record<string, unknown>,
  aliases: Set<string>,
): void {
  resultRecord(value, [
    "summary",
    "participation",
    "patterns",
    "limitations",
    "readiness",
    "options",
  ]);
  resultString(value.summary);
  const participation = resultRecord(value.participation, [
    "submitted",
    "expected",
  ]);
  if (
    !Number.isInteger(participation.submitted) ||
    Number(participation.submitted) < 0 ||
    (participation.expected !== null &&
      (!Number.isInteger(participation.expected) ||
        Number(participation.expected) < 0))
  ) invalidResult();

  for (const patternValue of resultArray(value.patterns)) {
    const pattern = resultRecord(patternValue, [
      "key",
      "label",
      "description",
      "responseIds",
      "evidence",
    ]);
    resultString(pattern.key);
    resultString(pattern.label);
    resultString(pattern.description);
    stringArray(pattern.responseIds, aliases);
    for (const evidenceValue of resultArray(pattern.evidence)) {
      const evidence = resultRecord(evidenceValue, ["responseId", "excerpt"]);
      const responseId = resultString(evidence.responseId);
      if (!aliases.has(responseId)) invalidResult();
      resultString(evidence.excerpt);
    }
  }
  stringArray(value.limitations);
  const readiness = resultRecord(value.readiness, ["status", "rationale"]);
  if (
    !["advance", "intervene", "insufficient_evidence"].includes(
      String(readiness.status),
    )
  ) invalidResult();
  resultString(readiness.rationale);
  const options = resultArray(value.options);
  if (options.length < 2 || options.length > 4) invalidResult();
  for (const optionValue of options) {
    const option = resultRecord(optionValue, [
      "key",
      "title",
      "rationale",
      "activity",
    ]);
    resultString(option.key);
    resultString(option.title);
    resultString(option.rationale);
    assertThreeColumnActivity(option.activity);
  }
}

function assertLearningComparison(
  value: Record<string, unknown>,
  aliases: Set<string>,
): void {
  resultRecord(value, [
    "summary",
    "observedChanges",
    "persistentDifficulties",
    "limitations",
    "recommendation",
  ]);
  resultString(value.summary);
  for (const changeValue of resultArray(value.observedChanges)) {
    const change = resultRecord(changeValue, [
      "label",
      "description",
      "initialEvidenceIds",
      "transferEvidenceIds",
    ]);
    resultString(change.label);
    resultString(change.description);
    stringArray(change.initialEvidenceIds, aliases);
    stringArray(change.transferEvidenceIds, aliases);
  }
  for (const difficultyValue of resultArray(value.persistentDifficulties)) {
    const difficulty = resultRecord(difficultyValue, [
      "label",
      "description",
      "responseIds",
    ]);
    resultString(difficulty.label);
    resultString(difficulty.description);
    stringArray(difficulty.responseIds, aliases);
  }
  stringArray(value.limitations);
  const recommendation = resultRecord(value.recommendation, [
    "status",
    "rationale",
  ]);
  if (
    !["advance", "reinforce", "insufficient_evidence"].includes(
      String(recommendation.status),
    )
  ) invalidResult();
  resultString(recommendation.rationale);
}

export function assertAiResult(
  operation: AiOperation,
  value: unknown,
  context: {
    allowedAliasIds?: string[];
    expectedIntent?: Extract<
      PaideiaAiRequest,
      { operation: "assist_user" }
    >["intent"];
  } = {},
): void {
  const result = resultRecord(value);
  const aliases = new Set(context.allowedAliasIds ?? []);

  if (operation === "analyze_stage") {
    return assertStageAnalysis(result, aliases);
  }
  if (operation === "compare_learning") {
    return assertLearningComparison(result, aliases);
  }
  resultRecord(result, [
    "intent",
    "message",
    "nextAction",
    "boundaryNotice",
    "model",
    "isFreeModel",
  ]);
  if (!context.expectedIntent || result.intent !== context.expectedIntent) {
    invalidResult();
  }
  resultString(result.message);
  resultString(result.nextAction);
  if (result.boundaryNotice !== undefined) resultString(result.boundaryNotice);
  resultString(result.model);
  if (result.isFreeModel !== true) invalidResult();
}
