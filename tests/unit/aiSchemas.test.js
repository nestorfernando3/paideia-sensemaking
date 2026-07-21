import { describe, expect, it } from "vitest";
import {
  parseStageAnalysis,
  parseLearningComparison,
  parseUserAssistance,
} from "../../src/domain/aiSchemas.js";

describe("aiSchemas", () => {
  describe("parseStageAnalysis", () => {
    it("valida un resultado de análisis de etapa correcto", () => {
      const validData = {
        summary: "La mayoría confundió el contenido literal con la intención implícita.",
        participation: {
          submitted: 15,
          expected: 20,
        },
        patterns: [
          {
            key: "literal_confusion",
            label: "Interpretación literal",
            description: "Los estudiantes tomaron la frase al pie de la letra.",
            responseIds: ["resp-1", "resp-2"],
            evidence: [
              {
                responseId: "resp-1",
                excerpt: "Dijo que tenía frío",
              },
            ],
          },
        ],
        limitations: ["Faltaron 5 respuestas por entregar"],
        readiness: {
          status: "intervene",
          rationale: "Existe confusión generalizada entre actos locutivos e ilocutivos.",
        },
        options: [
          {
            key: "opt-1",
            title: "Desglose de tres columnas",
            rationale: "Ayudará a separar lo dicho de la intención",
            activity: {
              type: "three_column",
              title: "Separar acto e intención",
              prompt: "Completa las columnas para la frase expresada",
              columns: [
                { key: "said", label: "Qué se dijo" },
                { key: "intended", label: "Qué se intentó hacer" },
                { key: "effect", label: "Qué efecto produjo" },
              ],
            },
          },
        ],
      };

      const parsed = parseStageAnalysis(validData);
      expect(parsed.summary).toContain("literal");
      expect(parsed.readiness.status).toBe("intervene");
      expect(parsed.options[0].activity.type).toBe("three_column");
    });

    it("rechaza análisis con caracteres < o > en texto", () => {
      const invalidData = {
        summary: "Resumen con <img src=x onerror=alert(1)>",
        participation: { submitted: 5, expected: 5 },
        patterns: [],
        limitations: [],
        readiness: { status: "advance", rationale: "Todo claro" },
        options: [],
      };

      expect(() => parseStageAnalysis(invalidData)).toThrow();
    });
  });

  describe("parseLearningComparison", () => {
    it("valida un resultado de comparación de aprendizaje correcto", () => {
      const validData = {
        summary: "El 80% de los estudiantes logró distinguir la intención en el caso nuevo.",
        observedChanges: [
          {
            label: "Distinción de intención",
            description: "Pasaron de interpretar literalmente a identificar el acto ilocutivo.",
            initialEvidenceIds: ["resp-1"],
            transferEvidenceIds: ["resp-10"],
          },
        ],
        persistentDifficulties: [
          {
            label: "Confusión con efecto perlocutivo",
            description: "Aún confunden la intención del hablante con la reacción del oyente.",
            responseIds: ["resp-12"],
          },
        ],
        limitations: ["No todos justificaron extensamente su respuesta."],
        recommendation: {
          status: "advance",
          rationale: "La mayoría logró la transferencia conceptual esperada.",
        },
      };

      const parsed = parseLearningComparison(validData);
      expect(parsed.recommendation.status).toBe("advance");
      expect(parsed.observedChanges).toHaveLength(1);
    });

    it("rechaza comparación con HTML o < >", () => {
      const invalidData = {
        summary: "Resumen ok",
        observedChanges: [],
        persistentDifficulties: [],
        limitations: ["Dificultad <script>"],
        recommendation: { status: "advance", rationale: "Ok" },
      };

      expect(() => parseLearningComparison(invalidData)).toThrow();
    });
  });

  describe("parseUserAssistance", () => {
    it("valida una respuesta de ayuda al usuario válida", () => {
      const validData = {
        intent: "hint",
        message: "Piensa en qué busca lograr la persona al decir eso, no solo en las palabras.",
        nextAction: "Revisa la segunda columna.",
        boundaryNotice: "Esta es una pista orientadora.",
        model: "nemotron-3-ultra-free",
        isFreeModel: true,
      };

      const parsed = parseUserAssistance(validData);
      expect(parsed.intent).toBe("hint");
      expect(parsed.isFreeModel).toBe(true);
    });

    it("rechaza si isFreeModel no es true o si contiene < >", () => {
      const invalidModel = {
        intent: "hint",
        message: "Pista simple",
        nextAction: "Continuar",
        model: "gpt-4",
        isFreeModel: false,
      };

      expect(() => parseUserAssistance(invalidModel)).toThrow();

      const invalidHtml = {
        intent: "hint",
        message: "Pista con <b>HTML</b>",
        nextAction: "Continuar",
        model: "nemotron-3-ultra-free",
        isFreeModel: true,
      };

      expect(() => parseUserAssistance(invalidHtml)).toThrow();
    });
  });
});
