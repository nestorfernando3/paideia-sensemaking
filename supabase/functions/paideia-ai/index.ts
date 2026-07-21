import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  assertAiAuthorization,
  extractBearerToken,
  verifyJwtUser,
} from "../_shared/auth.ts";
import {
  assertAiResult,
  PaideiaAiRequest,
  parsePaideiaAiRequest,
  safePostgrestErrorCode,
  statusForError,
} from "../_shared/contracts.ts";
import {
  createEphemeralPseudonymMap,
  redactObjectPII,
  redactText,
} from "../_shared/redaction.ts";
import { computeSha256 } from "../_shared/hash.ts";
import {
  extractJsonObject,
  fetchOpenCodeModelCosts,
  fetchZenModelIds,
  selectFreeModels,
} from "../_shared/modelRegistry.ts";
import { callZenChatCompletion } from "../_shared/zen.ts";
import {
  ANALYZE_STAGE_PROMPT_VERSION,
  buildAnalyzeStagePrompt,
} from "../_shared/prompts/analyzeStage.ts";
import {
  buildCompareLearningPrompt,
  COMPARE_LEARNING_PROMPT_VERSION,
} from "../_shared/prompts/compareLearning.ts";
import {
  ASSIST_USER_PROMPT_VERSION,
  buildAssistUserPrompt,
} from "../_shared/prompts/assistUser.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type SessionRow = {
  status: string;
  topic: string;
  learning_objective: string;
  success_criteria: string;
  allow_free_ai_assistance: boolean;
  ai_disclosure_version: string | null;
  allow_collective_external_ai: boolean;
  collective_ai_attested_at: string | null;
  collective_ai_notice_version: string | null;
};

type MemberRow = { role: string; free_ai_consent_at: string | null };
type StageRow = { id: string; stage_kind: string; activity_spec: unknown };
type CollectiveResponse = {
  stage_run_id: string;
  subject_user_id: string;
  payload: unknown;
};
type AiRun = {
  id: string;
  status: "pending" | "running" | "succeeded" | "failed";
  result: unknown;
  used_model: string | null;
  error_code: string | null;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function supabaseRequest<T>(input: {
  url: string;
  key: string;
  token?: string;
  path: string;
  method?: string;
  body?: unknown;
  prefer?: string;
}): Promise<T> {
  const response = await fetch(`${input.url}/rest/v1/${input.path}`, {
    method: input.method ?? "GET",
    headers: {
      "apikey": input.key,
      "Authorization": `Bearer ${input.token ?? input.key}`,
      "Content-Type": "application/json",
      ...(input.prefer ? { "Prefer": input.prefer } : {}),
    },
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(safePostgrestErrorCode(error, response.status));
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

function one<T>(rows: T[], errorCode: string): T {
  if (rows.length !== 1) throw new Error(errorCode);
  return rows[0];
}

function safeErrorCode(error: unknown): string {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  return /^[A-Z][A-Z0-9_]*(?:_\d{3})?$/.test(code) ? code : "UNEXPECTED_ERROR";
}

async function loadStage(
  env: { url: string; serviceKey: string },
  sessionId: string,
  stageRunId: string,
): Promise<StageRow> {
  const rows = await supabaseRequest<StageRow[]>({
    ...env,
    key: env.serviceKey,
    path:
      `ps_stage_runs?select=id,stage_kind,activity_spec&id=eq.${stageRunId}&session_id=eq.${sessionId}`,
  });
  return one(rows, "STAGE_NOT_FOUND");
}

async function loadCollectiveResponses(
  env: { url: string; serviceKey: string },
  sessionId: string,
  stageRunIds: string[],
): Promise<CollectiveResponse[]> {
  return await supabaseRequest<CollectiveResponse[]>({
    ...env,
    key: env.serviceKey,
    path: "rpc/ps_get_collective_ai_responses",
    method: "POST",
    body: { p_session_id: sessionId, p_stage_run_ids: stageRunIds },
  });
}

function pseudonymize(
  responses: CollectiveResponse[],
  aliases: Record<string, string>,
) {
  return responses.map((response) => ({
    aliasId: aliases[response.subject_user_id],
    payload: redactObjectPII(response.payload),
  }));
}

function contextOf(session: SessionRow) {
  return {
    topic: redactText(session.topic),
    learningObjective: redactText(session.learning_objective),
    successCriteria: redactText(session.success_criteria),
  };
}

async function preparePrompts(input: {
  request: PaideiaAiRequest;
  userId: string;
  session: SessionRow;
  env: { url: string; serviceKey: string };
  selectedModel: string;
}): Promise<{
  systemPrompt: string;
  userPrompt: string;
  promptVersion: string;
  stageRunId: string;
  noticeVersion: string;
  hashMaterial: unknown;
  allowedAliasIds: string[];
}> {
  const { request, session, env } = input;
  const context = contextOf(session);

  if (request.operation === "analyze_stage") {
    const stage = await loadStage(env, request.sessionId, request.stageRunId);
    const rows = await loadCollectiveResponses(env, request.sessionId, [
      stage.id,
    ]);
    const aliases = createEphemeralPseudonymMap([
      ...new Set(rows.map((row) => row.subject_user_id)),
    ]);
    const prompts = buildAnalyzeStagePrompt({
      ...context,
      stageKind: stage.stage_kind,
      responses: pseudonymize(rows, aliases),
    });
    return {
      systemPrompt: prompts.system,
      userPrompt: prompts.user,
      promptVersion: ANALYZE_STAGE_PROMPT_VERSION,
      stageRunId: stage.id,
      noticeVersion: session.collective_ai_notice_version!,
      allowedAliasIds: Object.values(aliases),
      hashMaterial: {
        ...context,
        stageKind: stage.stage_kind,
        responses: rows.map((row) => redactObjectPII(row.payload)),
      },
    };
  }

  if (request.operation === "compare_learning") {
    const [initialStage, transferStage] = await Promise.all([
      loadStage(env, request.sessionId, request.initialStageRunId),
      loadStage(env, request.sessionId, request.transferStageRunId),
    ]);
    const rows = await loadCollectiveResponses(env, request.sessionId, [
      initialStage.id,
      transferStage.id,
    ]);
    const aliases = createEphemeralPseudonymMap([
      ...new Set(rows.map((row) => row.subject_user_id)),
    ]);
    const prompts = buildCompareLearningPrompt({
      ...context,
      initialResponses: pseudonymize(
        rows.filter((row) => row.stage_run_id === initialStage.id),
        aliases,
      ),
      transferResponses: pseudonymize(
        rows.filter((row) => row.stage_run_id === transferStage.id),
        aliases,
      ),
    });
    return {
      systemPrompt: prompts.system,
      userPrompt: prompts.user,
      promptVersion: COMPARE_LEARNING_PROMPT_VERSION,
      stageRunId: initialStage.id,
      noticeVersion: session.collective_ai_notice_version!,
      allowedAliasIds: Object.values(aliases),
      hashMaterial: {
        ...context,
        initialResponses: rows.filter((row) =>
          row.stage_run_id === initialStage.id
        ).map((row) => redactObjectPII(row.payload)),
        transferResponses: rows.filter((row) =>
          row.stage_run_id === transferStage.id
        ).map((row) => redactObjectPII(row.payload)),
      },
    };
  }

  const stage = await loadStage(env, request.sessionId, request.stageRunId);
  const responseFilter = request.responseId
    ? `&id=eq.${request.responseId}`
    : "&limit=1";
  const responses = await supabaseRequest<Array<{ payload: unknown }>>({
    ...env,
    key: env.serviceKey,
    path:
      `ps_responses?select=payload&session_id=eq.${request.sessionId}&stage_run_id=eq.${stage.id}&user_id=eq.${input.userId}${responseFilter}`,
  });
  const prompts = buildAssistUserPrompt({
    intent: request.intent,
    topic: context.topic,
    learningObjective: context.learningObjective,
    activitySpec: redactObjectPII(stage.activity_spec),
    currentResponse: responses[0]
      ? redactObjectPII(responses[0].payload)
      : undefined,
    selectedModel: input.selectedModel,
  });
  return {
    systemPrompt: prompts.system,
    userPrompt: prompts.user,
    promptVersion: ASSIST_USER_PROMPT_VERSION,
    stageRunId: stage.id,
    noticeVersion: session.ai_disclosure_version!,
    allowedAliasIds: [],
    hashMaterial: {
      ...context,
      intent: request.intent,
      activitySpec: redactObjectPII(stage.activity_spec),
      currentResponse: responses[0]
        ? redactObjectPII(responses[0].payload)
        : null,
    },
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  let runId: string | null = null;
  let databaseEnv: { url: string; serviceKey: string } | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return json({ error: "SUPABASE_NOT_CONFIGURED" }, 500);
    }
    databaseEnv = { url: supabaseUrl, serviceKey };

    const jwtToken = extractBearerToken(req);
    const userId = await verifyJwtUser({ supabaseUrl, anonKey, jwtToken });
    const request = parsePaideiaAiRequest(await req.json());

    const [sessions, members] = await Promise.all([
      supabaseRequest<SessionRow[]>({
        url: supabaseUrl,
        key: serviceKey,
        path:
          `ps_sessions?select=status,topic,learning_objective,success_criteria,allow_free_ai_assistance,ai_disclosure_version,allow_collective_external_ai,collective_ai_attested_at,collective_ai_notice_version&id=eq.${request.sessionId}`,
      }),
      supabaseRequest<MemberRow[]>({
        url: supabaseUrl,
        key: serviceKey,
        path:
          `ps_members?select=role,free_ai_consent_at&session_id=eq.${request.sessionId}&user_id=eq.${userId}`,
      }),
    ]);
    const session = one(sessions, "SESSION_NOT_FOUND");
    const member = one(members, "MEMBER_REQUIRED");
    assertAiAuthorization({
      operation: request.operation,
      intent: request.operation === "assist_user" ? request.intent : undefined,
      session,
      member,
    });

    const apiKey = Deno.env.get("OPENCODE_ZEN_API_KEY");
    if (!apiKey) {
      return json({ error: "OPENCODE_ZEN_API_KEY_NOT_CONFIGURED" }, 500);
    }

    const [availability, costs] = await Promise.all([
      fetchZenModelIds(),
      fetchOpenCodeModelCosts(),
    ]);
    const eligibleModels = selectFreeModels({ availability, costs });
    if (eligibleModels.length === 0) {
      return json({ error: "FREE_MODEL_UNAVAILABLE" }, 503);
    }

    const prompts = await preparePrompts({
      request,
      userId,
      session,
      env: databaseEnv,
      selectedModel: eligibleModels[0],
    });
    const inputHash = await computeSha256({
      operation: request.operation,
      sessionId: request.sessionId,
      idempotencyKey: request.idempotencyKey,
      promptVersion: prompts.promptVersion,
      data: prompts.hashMaterial,
    });

    const reservedValue = await supabaseRequest<AiRun | AiRun[]>({
      url: supabaseUrl,
      key: anonKey,
      token: jwtToken,
      path: "rpc/ps_reserve_ai_run",
      method: "POST",
      body: {
        p_session_id: request.sessionId,
        p_stage_run_id: prompts.stageRunId,
        p_subject_user_id: request.operation === "assist_user" ? userId : null,
        p_operation: request.operation,
        p_visibility: request.operation === "assist_user"
          ? "requester"
          : "teacher",
        p_requested_model: eligibleModels[0],
        p_prompt_version: prompts.promptVersion,
        p_notice_version: prompts.noticeVersion,
        p_input_hash: inputHash,
      },
    });
    let reserved = Array.isArray(reservedValue)
      ? one(reservedValue, "AI_RESERVATION_FAILED")
      : reservedValue;
    runId = reserved.id;

    if (reserved.status === "succeeded") {
      assertAiResult(request.operation, reserved.result, {
        allowedAliasIds: prompts.allowedAliasIds,
        expectedIntent: request.operation === "assist_user"
          ? request.intent
          : undefined,
      });
      return json({
        success: true,
        data: reserved.result,
        model: reserved.used_model,
        isFreeModel: true,
        aiRunId: reserved.id,
      });
    }
    if (reserved.status === "failed") {
      // A free model can occasionally return an invalid payload even after the
      // repair pass. Keep the same idempotent run, but allow a later explicit
      // request to claim and retry it instead of poisoning this stage forever.
      const retried = await supabaseRequest<AiRun[]>({
        url: supabaseUrl,
        key: serviceKey,
        path: `ps_ai_runs?id=eq.${reserved.id}&status=eq.failed`,
        method: "PATCH",
        body: {
          status: "pending",
          error_code: null,
          completed_at: null,
        },
        prefer: "return=representation",
      });
      if (retried.length !== 1) {
        return json({ error: "AI_RUN_IN_PROGRESS", aiRunId: reserved.id }, 409);
      }
      reserved = retried[0];
    }

    const claimed = await supabaseRequest<AiRun[]>({
      url: supabaseUrl,
      key: serviceKey,
      path: `ps_ai_runs?id=eq.${reserved.id}&status=eq.pending`,
      method: "PATCH",
      body: { status: "running" },
      prefer: "return=representation",
    });
    if (claimed.length !== 1) {
      return json({ error: "AI_RUN_IN_PROGRESS", aiRunId: reserved.id }, 409);
    }

    let resultJson: unknown = null;
    let usedModel = "";
    let fallbackIndex = 0;
    for (let i = 0; i < eligibleModels.length && !resultJson; i++) {
      const candidateModel = eligibleModels[i];
      try {
        const completion = await callZenChatCompletion({
          apiKey,
          candidateModel,
          messages: [
            { role: "system", content: prompts.systemPrompt },
            { role: "user", content: prompts.userPrompt },
          ],
        });
        let candidateResult: unknown;
        let candidateUsedModel = completion.usedModel;
        try {
          candidateResult = extractJsonObject(completion.rawContent);
          if (
            request.operation === "assist_user" && candidateResult &&
            typeof candidateResult === "object"
          ) {
            candidateResult = {
              ...candidateResult,
              model: candidateUsedModel,
              isFreeModel: true,
            };
          }
          assertAiResult(request.operation, candidateResult, {
            allowedAliasIds: prompts.allowedAliasIds,
            expectedIntent: request.operation === "assist_user"
              ? request.intent
              : undefined,
          });
        } catch {
          const repaired = await callZenChatCompletion({
            apiKey,
            candidateModel,
            messages: [
              { role: "system", content: prompts.systemPrompt },
              { role: "user", content: prompts.userPrompt },
              { role: "assistant", content: completion.rawContent },
              {
                role: "user",
                content:
                  "La salida anterior no cumplió el contrato. Devuelve únicamente JSON válido con el esquema solicitado.",
              },
            ],
          });
          candidateUsedModel = repaired.usedModel;
          candidateResult = extractJsonObject(repaired.rawContent);
          if (
            request.operation === "assist_user" && candidateResult &&
            typeof candidateResult === "object"
          ) {
            candidateResult = {
              ...candidateResult,
              model: candidateUsedModel,
              isFreeModel: true,
            };
          }
          assertAiResult(request.operation, candidateResult, {
            allowedAliasIds: prompts.allowedAliasIds,
            expectedIntent: request.operation === "assist_user"
              ? request.intent
              : undefined,
          });
        }

        usedModel = candidateUsedModel;
        fallbackIndex = i;
        resultJson = candidateResult;
      } catch (error) {
        console.warn(
          JSON.stringify({
            operation: request.operation,
            candidateModel,
            fallbackIndex: i,
            errorCode: safeErrorCode(error),
          }),
        );
      }
    }

    if (!resultJson) throw new Error("FREE_MODEL_UNAVAILABLE");

    await supabaseRequest<void>({
      url: supabaseUrl,
      key: serviceKey,
      path: `ps_ai_runs?id=eq.${reserved.id}`,
      method: "PATCH",
      body: {
        status: "succeeded",
        result: resultJson,
        used_model: usedModel,
        fallback_index: fallbackIndex,
        completed_at: new Date().toISOString(),
      },
      prefer: "return=minimal",
    });

    console.log(
      JSON.stringify({
        operation: request.operation,
        requestedModel: eligibleModels[0],
        usedModel,
        fallbackIndex,
        isFreeModel: true,
        status: "succeeded",
      }),
    );
    return json({
      success: true,
      data: resultJson,
      model: usedModel,
      isFreeModel: true,
      aiRunId: reserved.id,
    });
  } catch (error) {
    const errorCode = safeErrorCode(error);
    if (runId && databaseEnv) {
      try {
        await supabaseRequest<void>({
          url: databaseEnv.url,
          key: databaseEnv.serviceKey,
          path: `ps_ai_runs?id=eq.${runId}&status=eq.running`,
          method: "PATCH",
          body: {
            status: "failed",
            error_code: errorCode,
            completed_at: new Date().toISOString(),
          },
          prefer: "return=minimal",
        });
      } catch {
        console.error(
          JSON.stringify({ operation: "persist_failure" }),
        );
      }
    }
    return json({ error: errorCode }, statusForError(errorCode));
  }
});
