import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { assertAiAuthorization, verifyJwtUser } from "../../_shared/auth.ts";
import {
  assertAiResult,
  parsePaideiaAiRequest,
  safePostgrestErrorCode,
} from "../../_shared/contracts.ts";
import { redactObjectPII } from "../../_shared/redaction.ts";

Deno.test("verifyJwtUser accepts only a user validated by Supabase Auth", async () => {
  const fetcher = (() =>
    Promise.resolve(
      new Response(JSON.stringify({ id: "user-1" }), { status: 200 }),
    )) as typeof fetch;
  assertEquals(
    await verifyJwtUser({
      supabaseUrl: "https://example.supabase.co",
      anonKey: "anon",
      jwtToken: "jwt",
      fetcher,
    }),
    "user-1",
  );

  const rejected =
    (() =>
      Promise.resolve(new Response("{}", { status: 401 }))) as typeof fetch;
  await assertRejects(
    () =>
      verifyJwtUser({
        supabaseUrl: "https://example.supabase.co",
        anonKey: "anon",
        jwtToken: "forged",
        fetcher: rejected,
      }),
    Error,
    "INVALID_JWT",
  );
});

Deno.test("authorization fails closed without the applicable consent", () => {
  const session = {
    status: "active",
    allow_free_ai_assistance: true,
    ai_disclosure_version: "v1",
    allow_collective_external_ai: true,
    collective_ai_attested_at: "2026-07-20T00:00:00Z",
    collective_ai_notice_version: "v1",
  };

  assertThrows(
    () =>
      assertAiAuthorization({
        operation: "analyze_stage",
        session,
        member: { role: "student", free_ai_consent_at: null },
      }),
    Error,
    "TEACHER_REQUIRED",
  );
  assertThrows(
    () =>
      assertAiAuthorization({
        operation: "assist_user",
        intent: "hint",
        session,
        member: { role: "student", free_ai_consent_at: null },
      }),
    Error,
    "FREE_AI_CONSENT_REQUIRED",
  );
  assertThrows(
    () =>
      assertAiAuthorization({
        operation: "assist_user",
        intent: "rewrite_instruction",
        session,
        member: { role: "student", free_ai_consent_at: "2026-07-20T00:00:00Z" },
      }),
    Error,
    "TEACHER_REQUIRED",
  );
});

Deno.test("request validation and minimization reject IDs and identity-bearing payload keys", () => {
  assertThrows(
    () =>
      parsePaideiaAiRequest({
        operation: "analyze_stage",
        sessionId: "not-a-uuid",
      }),
    Error,
    "INVALID_SESSION_ID",
  );
  assertEquals(
    redactObjectPII({
      answer: "Escribe a ana@example.com",
      user_id: "auth-id",
      displayName: "Ana",
      join_code: "ABCDEF",
    }),
    { answer: "Escribe a [EMAIL]" },
  );
  assertThrows(
    () =>
      assertAiResult("assist_user", {
        intent: "hint",
        message: "<b>respuesta</b>",
        nextAction: "seguir",
        model: "mimo-v2.5-free",
        isFreeModel: true,
      }),
    Error,
    "INVALID_MODEL_RESULT",
  );
});

Deno.test("model results enforce nested types, real aliases, canonical columns and intent", () => {
  const analysis = {
    summary: "Hay una confusión recurrente.",
    participation: { submitted: 1, expected: 1 },
    patterns: [{
      key: "confusion",
      label: "Confusión",
      description: "Se mezclan intención y efecto.",
      responseIds: ["learner_1"],
      evidence: [{ responseId: "learner_1", excerpt: "Respuesta breve" }],
    }],
    limitations: ["Muestra pequeña"],
    readiness: { status: "intervene", rationale: "Conviene intervenir." },
    options: ["one", "two"].map((key) => ({
      key,
      title: "Separar dimensiones",
      rationale: "Hace explícita la distinción.",
      activity: {
        type: "three_column",
        title: "Tres columnas",
        prompt: "Completa cada columna.",
        columns: [
          { key: "said", label: "Qué se dijo" },
          { key: "intended", label: "Qué se intentó hacer" },
          { key: "effect", label: "Qué efecto produjo" },
        ],
      },
    })),
  };
  const context = { allowedAliasIds: ["learner_1"] };
  assertAiResult("analyze_stage", analysis, context);

  const inventedAlias = structuredClone(analysis);
  inventedAlias.patterns[0].evidence[0].responseId = "learner_99";
  assertThrows(
    () => assertAiResult("analyze_stage", inventedAlias, context),
    Error,
    "INVALID_MODEL_RESULT",
  );

  const wrongColumns = structuredClone(analysis);
  wrongColumns.options[0].activity.columns[1].key = "effect";
  assertThrows(
    () => assertAiResult("analyze_stage", wrongColumns, context),
    Error,
    "INVALID_MODEL_RESULT",
  );

  assertThrows(
    () =>
      assertAiResult("assist_user", {
        intent: "example",
        message: "Pista",
        nextAction: "Continúa",
        model: "mimo-v2.5-free",
        isFreeModel: true,
      }, { expectedIntent: "hint" }),
    Error,
    "INVALID_MODEL_RESULT",
  );
});

Deno.test("PostgREST errors expose only approved application codes", () => {
  assertEquals(
    safePostgrestErrorCode({
      code: "P0001",
      message: "RATE_LIMIT_ASSIST_EXCEEDED",
      details: "sensitive database detail",
    }, 400),
    "RATE_LIMIT_ASSIST_EXCEEDED",
  );
  assertEquals(
    safePostgrestErrorCode({
      code: "23505",
      message: "duplicate key contains private data",
    }, 409),
    "DATABASE_REQUEST_FAILED_409",
  );
});
