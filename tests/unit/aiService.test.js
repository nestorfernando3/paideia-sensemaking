import { describe, expect, it, vi } from "vitest";
import { runStageAnalysis } from "../../src/services/aiService.js";
import { supabase } from "../../src/utils/supabase.js";

vi.mock("../../src/utils/supabase.js", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

describe("errores de la Edge Function", () => {
  it("conserva el código seguro devuelto por el servidor", async () => {
    supabase.functions.invoke.mockResolvedValueOnce({
      data: null,
      error: {
        message: "Edge Function returned a non-2xx status code",
        context: {
          clone: () => ({ json: async () => ({ error: "AI_RUN_IN_PROGRESS" }) }),
        },
      },
    });

    await expect(runStageAnalysis({
      sessionId: "session-1",
      stageRunId: "stage-1",
    })).rejects.toThrow("AI_RUN_IN_PROGRESS");
  });
});
