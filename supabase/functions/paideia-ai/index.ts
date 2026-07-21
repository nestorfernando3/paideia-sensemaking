import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { extractBearerToken, parseJwtSubject } from "../_shared/auth.ts";
import { PaideiaAiRequest } from "../_shared/contracts.ts";
import { redactObjectPII, createEphemeralPseudonymMap } from "../_shared/redaction.ts";
import { computeSha256 } from "../_shared/hash.ts";
import {
  fetchZenModelIds,
  fetchOpenCodeModelCosts,
  selectFreeModels,
  extractJsonObject,
} from "../_shared/modelRegistry.ts";
import { callZenChatCompletion } from "../_shared/zen.ts";
import { buildAnalyzeStagePrompt, ANALYZE_STAGE_PROMPT_VERSION } from "../_shared/prompts/analyzeStage.ts";
import { buildCompareLearningPrompt, COMPARE_LEARNING_PROMPT_VERSION } from "../_shared/prompts/compareLearning.ts";
import { buildAssistUserPrompt, ASSIST_USER_PROMPT_VERSION } from "../_shared/prompts/assistUser.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const jwtToken = extractBearerToken(req);
    const userId = parseJwtSubject(jwtToken);

    const body = (await req.json()) as PaideiaAiRequest;
    const { operation, sessionId, idempotencyKey } = body;

    const apiKey = Deno.env.get("OPENCODE_ZEN_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENCODE_ZEN_API_KEY_NOT_CONFIGURED" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Fetch live model snapshots & select eligible free models
    const availability = await fetchZenModelIds();
    const costs = await fetchOpenCodeModelCosts();
    const eligibleModels = selectFreeModels({ availability, costs });

    if (eligibleModels.length === 0) {
      return new Response(
        JSON.stringify({ error: "FREE_MODEL_UNAVAILABLE" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Prepare payload & prompt based on operation
    let systemPrompt = "";
    let userPrompt = "";
    let promptVersion = "";

    if (operation === "analyze_stage") {
      promptVersion = ANALYZE_STAGE_PROMPT_VERSION;
      const sampleResponses = [
        { aliasId: "learner_01", payload: { response: "Dijo que tenía frío." } },
      ];
      const redactedResponses = redactObjectPII(sampleResponses) as typeof sampleResponses;
      const prompts = buildAnalyzeStagePrompt({
        topic: "Actos de habla",
        learningObjective: "Diferenciar acto e intención",
        successCriteria: "Identifica la intención implícita",
        stageKind: "initial_response",
        responses: redactedResponses,
      });
      systemPrompt = prompts.system;
      userPrompt = prompts.user;
    } else if (operation === "compare_learning") {
      promptVersion = COMPARE_LEARNING_PROMPT_VERSION;
      const sampleInitial = [{ aliasId: "learner_01", payload: { response: "Dijo que tenía frío" } }];
      const sampleTransfer = [{ aliasId: "learner_01", payload: { response: "Pidió cerrar la puerta" } }];
      const prompts = buildCompareLearningPrompt({
        topic: "Actos de habla",
        learningObjective: "Diferenciar acto e intención",
        successCriteria: "Identifica la intención implícita",
        initialResponses: sampleInitial,
        transferResponses: sampleTransfer,
      });
      systemPrompt = prompts.system;
      userPrompt = prompts.user;
    } else if (operation === "assist_user") {
      promptVersion = ASSIST_USER_PROMPT_VERSION;
      const intent = body.intent || "hint";
      const prompts = buildAssistUserPrompt({
        intent,
        topic: "Actos de habla",
        learningObjective: "Diferenciar acto e intención",
        activitySpec: { type: "open_response", title: "Actividad" },
        selectedModel: eligibleModels[0],
      });
      systemPrompt = prompts.system;
      userPrompt = prompts.user;
    } else {
      return new Response(
        JSON.stringify({ error: "INVALID_OPERATION" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const inputHash = await computeSha256({
      sessionId,
      operation,
      idempotencyKey,
      userPrompt,
    });

    // 3. Fallback execution loop across pre-validated eligible free models
    let resultJson: unknown = null;
    let usedModel = "";
    let selectedCandidate = "";
    let fallbackIndex = 0;

    for (let i = 0; i < eligibleModels.length; i++) {
      candidateLoop: {
        fallbackIndex = i;
        selectedCandidate = eligibleModels[i];

        try {
          const completion = await callZenChatCompletion({
            apiKey,
            candidateModel: selectedCandidate,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          });

          usedModel = completion.usedModel;
          try {
            resultJson = extractJsonObject(completion.rawContent);
            break; // Success! Exit loop
          } catch (jsonErr) {
            // Attempt 1 repair
            const repairCompletion = await callZenChatCompletion({
              apiKey,
              candidateModel: selectedCandidate,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
                { role: "assistant", content: completion.rawContent },
                {
                  role: "user",
                  content: `Tu salida anterior causó un error de formato: ${(jsonErr as Error).message}. Devuelve ÚNICAMENTE un objeto JSON válido según el esquema.`,
                },
              ],
            });
            usedModel = repairCompletion.usedModel;
            resultJson = extractJsonObject(repairCompletion.rawContent);
            break; // Repair success! Exit loop
          }
        } catch (err) {
          console.warn(`Fallback ${i} failed for model ${selectedCandidate}: ${(err as Error).message}`);
          // Proceed to next candidate in fallback loop
        }
      }
    }

    if (!resultJson) {
      // Log operational metadata (no prompt, no response, no PII)
      console.log(
        JSON.stringify({
          operation,
          selectedModel: selectedCandidate,
          effectiveModel: null,
          fallbackIndex,
          isFreeModel: true,
          status: "failed",
          inputHash,
          noticeVersion: "v1.0",
        })
      );
      return new Response(
        JSON.stringify({ error: "FREE_MODEL_UNAVAILABLE" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log operational metadata on success
    console.log(
      JSON.stringify({
        operation,
        selectedModel: selectedCandidate,
        effectiveModel: usedModel,
        fallbackIndex,
        isFreeModel: true,
        status: "succeeded",
        inputHash,
        noticeVersion: "v1.0",
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: resultJson,
        model: usedModel,
        isFreeModel: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
