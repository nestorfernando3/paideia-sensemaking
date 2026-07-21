import { supabase } from "../utils/supabase.js";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateJoinCode(random = Math.random) {
  return Array.from({ length: 6 }, () => {
    const index = Math.floor(random() * CODE_ALPHABET.length);
    return CODE_ALPHABET[index];
  }).join("");
}

export async function createSensemakingSession({
  displayName,
  gradeLevel,
  topic,
  learningObjective,
  successCriteria,
  allowFreeAiAssistance = false,
  aiDisclosureVersion = null,
  allowCollectiveExternalAi = false,
  collectiveAiNoticeVersion = null,
  teacherAttestsAuthorization = false,
  initialActivity,
}) {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    const joinCode = generateJoinCode();

    const { data, error } = await supabase.rpc("ps_create_session", {
      p_join_code: joinCode,
      p_display_name: displayName,
      p_grade_level: gradeLevel,
      p_topic: topic,
      p_learning_objective: learningObjective,
      p_success_criteria: successCriteria,
      p_allow_free_ai_assistance: allowFreeAiAssistance,
      p_ai_disclosure_version: aiDisclosureVersion,
      p_allow_collective_external_ai: allowCollectiveExternalAi,
      p_collective_ai_notice_version: collectiveAiNoticeVersion,
      p_teacher_attests_authorization: teacherAttestsAuthorization,
      p_initial_activity: initialActivity,
    });

    if (!error) {
      return data;
    }

    if (error.code === "23505" && attempts < maxAttempts) {
      continue;
    }

    throw error;
  }
}

export async function joinSensemakingSession(joinCode, displayName) {
  const { data, error } = await supabase.rpc("ps_join_session", {
    p_join_code: joinCode,
    p_display_name: displayName,
  });

  if (error) throw error;
  return data;
}

export async function getSensemakingSession(sessionId) {
  const { data, error } = await supabase
    .from("ps_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listSessionMembers(sessionId) {
  const { data, error } = await supabase
    .from("ps_members")
    .select("*")
    .eq("session_id", sessionId);

  if (error) throw error;
  return data;
}

export async function listStageRuns(sessionId) {
  const { data, error } = await supabase
    .from("ps_stage_runs")
    .select("*")
    .eq("session_id", sessionId)
    .order("sequence_number", { ascending: true });

  if (error) throw error;
  return data;
}

export async function activateStage(stageRunId) {
  const { data, error } = await supabase.rpc("ps_activate_stage", {
    p_stage_run_id: stageRunId,
  });

  if (error) throw error;
  return data;
}

export async function submitStageResponse({
  sessionId,
  stageRunId,
  userId,
  payload,
}) {
  const { data, error } = await supabase
    .from("ps_responses")
    .upsert(
      {
        session_id: sessionId,
        stage_run_id: stageRunId,
        user_id: userId,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stage_run_id,user_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function subscribeToSession(sessionId, callback) {
  const channel = supabase
    .channel(`ps_sessions:${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "ps_sessions",
        filter: `id=eq.${sessionId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

export function subscribeToStageResponses(stageRunId, callback) {
  const channel = supabase
    .channel(`ps_responses:${stageRunId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "ps_responses",
        filter: `stage_run_id=eq.${stageRunId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}
