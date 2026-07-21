import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  generateJoinCode,
  createSensemakingSession,
  joinSensemakingSession,
  getSensemakingSession,
  listSessionMembers,
  listStageRuns,
  listSessionResponses,
  activateStage,
  createTransferStage,
  endSensemakingSession,
  submitStageResponse,
  subscribeToSession,
  subscribeToStageResponses,
} from "../../src/services/sessionService.js";
import { supabase } from "../../src/utils/supabase.js";

vi.mock("../../src/utils/supabase.js", () => {
  return {
    supabase: {
      auth: { getUser: vi.fn() },
      rpc: vi.fn(),
      from: vi.fn(),
      channel: vi.fn(),
    },
  };
});

describe("sessionService & sensemakingRepository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("generateJoinCode", () => {
    it("genera un código de 6 caracteres con el alfabeto permitido", () => {
      const code = generateJoinCode();
      expect(code).toMatch(/^[A-Z2-9]{6}$/);
    });

    it("usa la función aleatoria proporcionada para la generación determinista", () => {
      const pseudoRandom = () => 0; // Apunta siempre al primer carácter 'A'
      const code = generateJoinCode(pseudoRandom);
      expect(code).toBe("AAAAAA");
    });
  });

  describe("createSensemakingSession", () => {
    it("invoca rpc('ps_create_session') con los parámetros correctos", async () => {
      const mockSession = { id: "sess-1", join_code: "ABCDEF" };
      supabase.rpc.mockResolvedValueOnce({ data: mockSession, error: null });

      const input = {
        displayName: "Prof. Laura",
        gradeLevel: "9° A",
        topic: "Actos de Habla",
        learningObjective: "Distinguir actos locutivos, ilocutivos y perlocutivos",
        successCriteria: "El estudiante identifica la intención detrás de la frase",
        allowFreeAiAssistance: true,
        aiDisclosureVersion: "v1.0",
        allowCollectiveExternalAi: true,
        collectiveAiNoticeVersion: "v1.0",
        teacherAttestsAuthorization: true,
        initialActivity: {
          type: "open_response",
          title: "Respuesta Inicial",
          prompt: "¿Qué quiso decir?",
          responseLabel: "Tu respuesta",
          maxLength: 500,
        },
      };

      const result = await createSensemakingSession(input);

      expect(supabase.rpc).toHaveBeenCalledWith(
        "ps_create_session",
        expect.objectContaining({
          p_display_name: "Prof. Laura",
          p_grade_level: "9° A",
          p_topic: "Actos de Habla",
          p_allow_free_ai_assistance: true,
          p_allow_collective_external_ai: true,
          p_teacher_attests_authorization: true,
        })
      );
      expect(result).toEqual(mockSession);
    });

    it("reintenta hasta 3 veces ante colisión de código (código de error 23505)", async () => {
      const collisionError = { code: "23505", message: "unique violation" };
      const mockSession = { id: "sess-2", join_code: "XYZ890" };

      supabase.rpc
        .mockResolvedValueOnce({ data: null, error: collisionError })
        .mockResolvedValueOnce({ data: null, error: collisionError })
        .mockResolvedValueOnce({ data: mockSession, error: null });

      const input = {
        displayName: "Prof. Carlos",
        gradeLevel: "10° B",
        topic: "Argumentación",
        learningObjective: "Identificar premisas y conclusiones en el texto",
        successCriteria: "El estudiante señala la premisa principal",
        allowFreeAiAssistance: false,
        allowCollectiveExternalAi: false,
        initialActivity: {
          type: "open_response",
          title: "Inicio",
          prompt: "Lee el texto",
          responseLabel: "Respuesta",
          maxLength: 500,
        },
      };

      const result = await createSensemakingSession(input);
      expect(supabase.rpc).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockSession);
    });
  });

  describe("joinSensemakingSession", () => {
    it("registra los consentimientos elegidos con la identidad autenticada", async () => {
      const mockSession = {
        id: "sess-1",
        join_code: "JOIN12",
        allow_free_ai_assistance: true,
        ai_disclosure_version: "v1.0",
        allow_collective_external_ai: true,
        collective_ai_notice_version: "v1.0",
      };
      supabase.rpc.mockResolvedValueOnce({ data: mockSession, error: null });
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "auth-user-1" } } });
      const updateMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const selectMock = vi.fn().mockResolvedValueOnce({ data: [{}], error: null });
      supabase.from.mockReturnValueOnce({ update: updateMock, eq: eqMock, select: selectMock });

      const result = await joinSensemakingSession("JOIN12", "Estudiante Juan", {
        allowFreeAiAssistance: true,
        allowCollectiveExternalAi: true,
      });

      expect(supabase.rpc).toHaveBeenCalledWith("ps_join_session", {
        p_join_code: "JOIN12",
        p_display_name: "Estudiante Juan",
      });
      expect(supabase.from).toHaveBeenCalledWith("ps_members");
      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
        free_ai_consent_at: expect.any(String),
        collective_external_ai_consent_at: expect.any(String),
        collective_external_ai_consent_version: "v1.0",
      }));
      expect(result).toEqual(mockSession);
    });

    it("mantiene nulos los consentimientos rechazados", async () => {
      const mockSession = {
        id: "sess-1",
        join_code: "JOIN12",
        allow_free_ai_assistance: true,
        allow_collective_external_ai: true,
      };
      supabase.rpc.mockResolvedValueOnce({ data: mockSession, error: null });
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "auth-user-1" } } });
      const updateMock = vi.fn().mockReturnThis();
      supabase.from.mockReturnValueOnce({
        update: updateMock,
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValueOnce({ data: [{}], error: null }),
      });

      await joinSensemakingSession("JOIN12", "Estudiante Juan");

      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
        free_ai_consent_at: null,
        collective_external_ai_consent_at: null,
        collective_external_ai_consent_version: null,
        collective_external_ai_consent_revoked_at: null,
      }));
    });
  });

  describe("getSensemakingSession y consultas", () => {
    it("getSensemakingSession consulta ps_sessions por ID y nunca sessions", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const maybeSingleMock = vi.fn().mockResolvedValueOnce({
        data: { id: "sess-1" },
        error: null,
      });

      supabase.from.mockReturnValueOnce({
        select: selectMock,
        eq: eqMock,
        maybeSingle: maybeSingleMock,
      });

      const session = await getSensemakingSession("sess-1");

      expect(supabase.from).toHaveBeenCalledWith("ps_sessions");
      expect(supabase.from).not.toHaveBeenCalledWith("sessions");
      expect(session).toEqual({ id: "sess-1" });
    });

    it("listSessionMembers consulta ps_members", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValueOnce({
        data: [{ user_id: "u1", role: "student" }],
        error: null,
      });

      supabase.from.mockReturnValueOnce({
        select: selectMock,
        eq: eqMock,
      });

      const members = await listSessionMembers("sess-1");
      expect(supabase.from).toHaveBeenCalledWith("ps_members");
      expect(members).toHaveLength(1);
    });

    it("listStageRuns consulta ps_stage_runs ordenado por sequence_number", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValueOnce({
        data: [{ id: "stage-1", sequence_number: 1 }],
        error: null,
      });

      supabase.from.mockReturnValueOnce({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
      });

      const stages = await listStageRuns("sess-1");
      expect(supabase.from).toHaveBeenCalledWith("ps_stage_runs");
      expect(stages).toHaveLength(1);
    });

    it("listSessionResponses consulta las respuestas visibles de la sesión", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValueOnce({
        data: [{ stage_run_id: "stage-1", user_id: "u1", payload: { answer: "Sí" } }],
        error: null,
      });

      supabase.from.mockReturnValueOnce({ select: selectMock, eq: eqMock });

      const responses = await listSessionResponses("sess-1");

      expect(supabase.from).toHaveBeenCalledWith("ps_responses");
      expect(selectMock).toHaveBeenCalledWith("stage_run_id,user_id,payload");
      expect(eqMock).toHaveBeenCalledWith("session_id", "sess-1");
      expect(responses).toHaveLength(1);
    });

    it("activateStage invoca rpc('ps_activate_stage')", async () => {
      const mockStage = { id: "stage-1", status: "active" };
      supabase.rpc.mockResolvedValueOnce({ data: mockStage, error: null });

      const result = await activateStage("stage-1");
      expect(supabase.rpc).toHaveBeenCalledWith("ps_activate_stage", {
        p_stage_run_id: "stage-1",
      });
      expect(result).toEqual(mockStage);
    });

    it("endSensemakingSession usa el RPC endurecido", async () => {
      supabase.rpc.mockResolvedValueOnce({ data: { id: "sess-1", status: "ended" }, error: null });

      await endSensemakingSession("sess-1");

      expect(supabase.rpc).toHaveBeenCalledWith("ps_end_session", {
        p_session_id: "sess-1",
      });
    });

    it("createTransferStage usa la identidad autenticada y la siguiente secuencia", async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "auth-user-1" } } });
      supabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [{ id: "stage-1", sequence_number: 1 }],
            error: null,
          }),
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: "stage-2", sequence_number: 2 },
            error: null,
          }),
        });

      const stage = await createTransferStage({
        sessionId: "sess-1",
        activitySpec: { type: "transfer_justification" },
      });

      expect(stage).toEqual({ id: "stage-2", sequence_number: 2 });
      expect(supabase.from).toHaveBeenNthCalledWith(2, "ps_stage_runs");
    });

    it("submitStageResponse usa upsert en ps_responses", async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "auth-user-1" } } });
      const upsertMock = vi.fn().mockReturnThis();
      const selectMock = vi.fn().mockReturnThis();
      const singleMock = vi.fn().mockResolvedValueOnce({
        data: { id: "resp-1" },
        error: null,
      });

      supabase.from.mockReturnValueOnce({
        upsert: upsertMock,
        select: selectMock,
        single: singleMock,
      });

      const response = await submitStageResponse({
        sessionId: "sess-1",
        stageRunId: "stage-1",
        payload: { answer: "Mi respuesta" },
      });

      expect(supabase.from).toHaveBeenCalledWith("ps_responses");
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: "sess-1",
          stage_run_id: "stage-1",
          user_id: "auth-user-1",
          payload: { answer: "Mi respuesta" },
        }),
        { onConflict: "stage_run_id,user_id" }
      );
      expect(response).toEqual({ id: "resp-1" });
    });
  });

  describe("suscripciones en tiempo real filtradas", () => {
    it("subscribeToSession suscribe a ps_sessions filtrado por id", () => {
      const onMock = vi.fn().mockReturnThis();
      const subscribeMock = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });

      supabase.channel.mockReturnValueOnce({
        on: onMock,
        subscribe: subscribeMock,
      });

      const callback = vi.fn();
      subscribeToSession("sess-123", callback);

      expect(supabase.channel).toHaveBeenCalledWith("ps_sessions:sess-123");
      expect(onMock).toHaveBeenCalledWith(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ps_sessions",
          filter: "id=eq.sess-123",
        },
        expect.any(Function)
      );
    });

    it("subscribeToStageResponses suscribe a ps_responses filtrado por stage_run_id", () => {
      const onMock = vi.fn().mockReturnThis();
      const subscribeMock = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });

      supabase.channel.mockReturnValueOnce({
        on: onMock,
        subscribe: subscribeMock,
      });

      const callback = vi.fn();
      subscribeToStageResponses("stage-456", callback);

      expect(supabase.channel).toHaveBeenCalledWith("ps_responses:stage-456");
      expect(onMock).toHaveBeenCalledWith(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ps_responses",
          filter: "stage_run_id=eq.stage-456",
        },
        expect.any(Function)
      );
    });
  });
});
