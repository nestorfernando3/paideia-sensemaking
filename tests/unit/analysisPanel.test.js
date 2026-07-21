import { describe, expect, it } from "vitest";
import { renderAnalysisPanel } from "../../src/components/analysisPanel.js";

describe("renderAnalysisPanel", () => {
  it("renderiza resumen, patrones, evidencias, limitaciones, disposición y opciones", () => {
    const analysis = {
      summary: "La mayoría confundió el contenido literal con la intención implícita.",
      participation: { submitted: 15, expected: 20 },
      patterns: [
        {
          key: "literal_confusion",
          label: "Interpretación literal",
          description: "Tomaron la frase al pie de la letra.",
          responseIds: ["resp-1"],
          evidence: [{ responseId: "resp-1", excerpt: "Dijo que tenía frío" }],
        },
      ],
      limitations: ["Faltaron 5 respuestas"],
      readiness: {
        status: "intervene",
        rationale: "Existe confusión entre actos locutivos e ilocutivos.",
      },
      options: [
        {
          key: "opt-1",
          title: "Desglose de tres columnas",
          rationale: "Ayudará a separar lo dicho de la intención",
          activity: {
            type: "three_column",
            title: "Separar acto e intención",
            prompt: "Completa las columnas",
            columns: [
              { key: "said", label: "Qué se dijo" },
              { key: "intended", label: "Qué se intentó hacer" },
              { key: "effect", label: "Qué efecto produjo" },
            ],
          },
        },
      ],
    };

    const html = renderAnalysisPanel(analysis, { usedModel: "nemotron-3-ultra-free" });

    expect(html).toContain("Resumen pedagógico");
    expect(html).toContain("Patrones observados");
    expect(html).toContain("Evidencias");
    expect(html).toContain("Límites del análisis");
    expect(html).toContain("Opciones para continuar");
    expect(html).toContain("nemotron-3-ultra-free");
  });
});
