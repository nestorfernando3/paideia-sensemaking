export function extractBearerToken(req: Request): string {
  const authHeader = req.headers.get("Authorization") ||
    req.headers.get("authorization");
  if (!authHeader) {
    throw new Error("MISSING_AUTH_HEADER");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    throw new Error("INVALID_AUTH_HEADER_FORMAT");
  }

  return parts[1];
}

export async function verifyJwtUser(input: {
  supabaseUrl: string;
  anonKey: string;
  jwtToken: string;
  fetcher?: typeof fetch;
}): Promise<string> {
  const response = await (input.fetcher ?? fetch)(
    `${input.supabaseUrl}/auth/v1/user`,
    {
      headers: {
        "apikey": input.anonKey,
        "Authorization": `Bearer ${input.jwtToken}`,
      },
    },
  );
  if (!response.ok) throw new Error("INVALID_JWT");

  const user = await response.json() as { id?: unknown };
  if (typeof user.id !== "string" || !user.id) throw new Error("INVALID_JWT");
  return user.id;
}

export type AiAuthorization = {
  operation: "analyze_stage" | "compare_learning" | "assist_user";
  intent?: "hint" | "rephrase" | "example" | "rewrite_instruction";
  session: {
    status: string;
    allow_free_ai_assistance: boolean;
    ai_disclosure_version: string | null;
    allow_collective_external_ai: boolean;
    collective_ai_attested_at: string | null;
    collective_ai_notice_version: string | null;
  };
  member: {
    role: string;
    free_ai_consent_at: string | null;
  };
};

export function assertAiAuthorization(input: AiAuthorization): void {
  if (input.session.status !== "active") throw new Error("SESSION_NOT_ACTIVE");

  if (
    input.operation === "analyze_stage" ||
    input.operation === "compare_learning"
  ) {
    if (input.member.role !== "teacher") throw new Error("TEACHER_REQUIRED");
    if (
      !input.session.allow_collective_external_ai ||
      !input.session.collective_ai_attested_at ||
      !input.session.collective_ai_notice_version
    ) throw new Error("COLLECTIVE_AI_NOT_AUTHORIZED");
    return;
  }

  if (
    !input.session.allow_free_ai_assistance ||
    !input.session.ai_disclosure_version ||
    !input.member.free_ai_consent_at
  ) throw new Error("FREE_AI_CONSENT_REQUIRED");

  if (
    input.intent === "rewrite_instruction" && input.member.role !== "teacher"
  ) {
    throw new Error("TEACHER_REQUIRED");
  }
}
