import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildAnalyzeStagePrompt } from "../../_shared/prompts/analyzeStage.ts";
import { buildCompareLearningPrompt } from "../../_shared/prompts/compareLearning.ts";
import { buildAssistUserPrompt } from "../../_shared/prompts/assistUser.ts";
import { syntheticSpeechActsResponses } from "../../../../tests/fixtures/speechActs.js";

Deno.test("buildAnalyzeStagePrompt genera prompt delimitado con datos sintéticos de actos de habla", () => {
  const responses = syntheticSpeechActsResponses.map((r: { payload: unknown }, i: number) => ({
    aliasId: `learner_${i + 1}`,
    payload: r.payload,
  }));

  const { system, user } = buildAnalyzeStagePrompt({
    topic: "Actos de habla",
    learningObjective: "Distinguir actos locutivos, ilocutivos y perlocutivos",
    successCriteria: "Identifica la intención implícita del hablante",
    stageKind: "initial_response",
    responses,
  });

  assertEquals(system.includes("three_column"), true);
  assertEquals(user.includes("BEGIN_DATA"), true);
  assertEquals(user.includes("learner_1"), true);
});

Deno.test("buildAssistUserPrompt incluye el modelo seleccionado y prohíbe entregar la respuesta final", () => {
  const { system, user } = buildAssistUserPrompt({
    intent: "hint",
    topic: "Actos de habla",
    learningObjective: "Distinguir intención de fuerza",
    activitySpec: { type: "open_response", title: "Test" },
    selectedModel: "nemotron-3-ultra-free",
  });

  assertEquals(system.includes("NUNCA entregues la respuesta final"), true);
  assertEquals(user.includes("nemotron-3-ultra-free") || system.includes("nemotron-3-ultra-free"), true);
});
