import { describe, expect, it } from "vitest";
import { renderSensemakingFlow } from "../../src/views/session.js";

const stages = [
  {
    id: "initial-1",
    stage_kind: "initial_response",
    sequence_number: 1,
    status: "closed",
    activity_spec: { title: "Interpretación inicial" },
  },
  {
    id: "transfer-2",
    stage_kind: "transfer",
    sequence_number: 2,
    status: "active",
    activity_spec: { title: "Caso nuevo" },
  },
];

describe("navegación Sensemaking", () => {
  it("permite al docente abrir todas las etapas", () => {
    const html = renderSensemakingFlow(stages, "teacher", "session-1");
    expect(html).toContain("#/session/session-1/stage/initial-1");
    expect(html).toContain("#/session/session-1/stage/transfer-2");
  });

  it("muestra al estudiante únicamente la etapa activa", () => {
    const html = renderSensemakingFlow(stages, "student", "session-1");
    expect(html).not.toContain("initial-1");
    expect(html).toContain("transfer-2");
  });
});
