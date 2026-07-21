import { describe, expect, it } from "vitest";
import { renderProcessMatrix } from "../../src/components/processMatrix.js";

describe("processMatrix", () => {
  it("renderiza la tabla de proceso pedagógico por estudiante y etapa", () => {
    const members = [
      { user_id: "u1", display_name: "Ana Lucía", role: "student" },
      { user_id: "u2", display_name: "Carlos Mario", role: "student" },
    ];

    const stageRuns = [
      { id: "s1", stage_kind: "initial_response", sequence_number: 1 },
      { id: "s2", stage_kind: "intervention", sequence_number: 2 },
      { id: "s3", stage_kind: "transfer", sequence_number: 3 },
    ];

    const responses = [
      { stage_run_id: "s1", user_id: "u1", payload: { response: "Respuesta 1" } },
      { stage_run_id: "s2", user_id: "u1", payload: { said: "A", intended: "B", effect: "C" } },
    ];

    const html = renderProcessMatrix({ members, stageRuns, responses });

    expect(html).toContain("Ana Lucía");
    expect(html).toContain("Carlos Mario");
    expect(html).toContain("Respondió");
    expect(html).toContain("Sin respuesta");
    expect(html).not.toContain("Calificación");
    expect(html).not.toContain("Nota:");
  });
});
