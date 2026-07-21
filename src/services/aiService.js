import { supabase } from "../utils/supabase.js";
import { parseStageAnalysis, parseLearningComparison, parseUserAssistance } from "../domain/aiSchemas.js";

export function createIdempotencyKey(operation, ...ids) {
  return [operation, ...ids].join(":");
}

export async function runStageAnalysis({ sessionId, stageRunId, idempotencyKey }) {
  const { data, error } = await supabase.functions.invoke("paideia-ai", {
    body: {
      operation: "analyze_stage",
      sessionId,
      stageRunId,
      idempotencyKey: idempotencyKey || createIdempotencyKey("analyze_stage", sessionId, stageRunId),
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  const validated = parseStageAnalysis(data.data);
  return {
    analysis: validated,
    usedModel: data.model,
    isFreeModel: data.isFreeModel,
  };
}

export async function runLearningComparison({ sessionId, initialStageRunId, transferStageRunId, idempotencyKey }) {
  const { data, error } = await supabase.functions.invoke("paideia-ai", {
    body: {
      operation: "compare_learning",
      sessionId,
      initialStageRunId,
      transferStageRunId,
      idempotencyKey: idempotencyKey || createIdempotencyKey("compare_learning", sessionId, initialStageRunId, transferStageRunId),
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  const validated = parseLearningComparison(data.data);
  return {
    comparison: validated,
    usedModel: data.model,
    isFreeModel: data.isFreeModel,
  };
}

export async function requestUserAssistance({ sessionId, stageRunId, intent, responseId, idempotencyKey }) {
  const { data, error } = await supabase.functions.invoke("paideia-ai", {
    body: {
      operation: "assist_user",
      sessionId,
      stageRunId,
      intent,
      responseId,
      idempotencyKey: idempotencyKey || createIdempotencyKey("assist_user", sessionId, stageRunId, intent),
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  const validated = parseUserAssistance(data.data);
  return validated;
}

export async function createInterventionFromOption({ sessionId, sourceStageRunId, aiRunId, optionKey, activitySpec }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  // Get current sequence count
  const { data: stages } = await supabase
    .from("ps_stage_runs")
    .select("sequence_number")
    .eq("session_id", sessionId)
    .order("sequence_number", { ascending: false });

  const nextSeq = (stages?.[0]?.sequence_number || 1) + 1;

  // Create new intervention stage_run
  const { data: newStage, error: stageErr } = await supabase
    .from("ps_stage_runs")
    .insert({
      session_id: sessionId,
      stage_kind: "intervention",
      sequence_number: nextSeq,
      activity_spec: activitySpec,
      created_by: user.id,
      status: "draft",
    })
    .select()
    .single();

  if (stageErr) throw stageErr;

  // Insert decision record
  const { error: decErr } = await supabase
    .from("ps_teacher_decisions")
    .insert({
      session_id: sessionId,
      source_ai_run_id: aiRunId || null,
      source_stage_run_id: sourceStageRunId,
      option_key: optionKey,
      activity_spec: activitySpec,
      activated_stage_run_id: newStage.id,
      teacher_user_id: user.id,
    });

  if (decErr) console.warn("Failed to insert decision record:", decErr);

  return newStage;
}
