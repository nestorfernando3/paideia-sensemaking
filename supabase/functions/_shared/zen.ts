export const ZEN_CHAT_COMPLETIONS_URL = "https://opencode.ai/zen/v1/chat/completions";

export const ZEN_CHAT_COMPLETIONS_IDS = new Set<string>([
  "nemotron-3-ultra-free",
  "hy3-free",
  "deepseek-v4-flash-free",
  "mimo-v2.5-free",
]);

export function extractText(body: unknown): string {
  const chat = body as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = chat.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;

  throw new Error("MODEL_TEXT_MISSING");
}

export async function callZenChatCompletion(input: {
  apiKey: string;
  candidateModel: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
}): Promise<{ rawContent: string; usedModel: string }> {
  if (!ZEN_CHAT_COMPLETIONS_IDS.has(input.candidateModel)) {
    throw new Error(`UNAUTHORIZED_CANDIDATE_MODEL: ${input.candidateModel}`);
  }

  const res = await fetch(ZEN_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.candidateModel,
      messages: input.messages,
      temperature: input.temperature ?? 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    throw new Error(`ZEN_API_ERROR_${res.status}`);
  }

  const jsonBody = (await res.json()) as { model?: string };
  const effectiveModel = jsonBody.model || input.candidateModel;

  if (effectiveModel !== input.candidateModel) {
    throw new Error(`MODEL_MISMATCH: expected ${input.candidateModel}, got ${effectiveModel}`);
  }

  const rawContent = extractText(jsonBody);
  return {
    rawContent,
    usedModel: effectiveModel,
  };
}
