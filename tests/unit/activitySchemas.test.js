import { describe, expect, it } from "vitest";
import { parseActivitySpec } from "../../src/domain/activitySchemas.js";

describe("parseActivitySpec", () => {
  it("acepta una actividad de respuesta abierta válida", () => {
    const activity = parseActivitySpec({
      type: "open_response",
      title: "Respuesta Inicial",
      prompt: "¿Qué quiso decir el hablante?",
      responseLabel: "Tu respuesta",
      maxLength: 500,
    });
    expect(activity.type).toBe("open_response");
    expect(activity.title).toBe("Respuesta Inicial");
  });

  it("acepta la intervención canónica de tres columnas", () => {
    const activity = parseActivitySpec({
      type: "three_column",
      title: "Distingue los actos",
      prompt: "Analiza la expresión",
      columns: [
        { key: "said", label: "Qué se dijo" },
        { key: "intended", label: "Qué se intentó hacer" },
        { key: "effect", label: "Qué efecto produjo" },
      ],
    });

    expect(activity.type).toBe("three_column");
    expect(activity.columns).toHaveLength(3);
  });

  it("acepta la actividad de transferencia con justificación", () => {
    const activity = parseActivitySpec({
      type: "transfer_justification",
      title: "Caso de transferencia",
      caseText: "Un docente dice: 'Hace calor aquí'.",
      fields: [
        { key: "said", label: "Qué se dijo" },
        { key: "intended", label: "Qué se intentó hacer" },
        { key: "effect", label: "Qué efecto produjo" },
        { key: "justification", label: "Explica por qué" },
      ],
    });
    expect(activity.type).toBe("transfer_justification");
    expect(activity.fields).toHaveLength(4);
  });

  it("rechaza HTML o caracteres < > en textos de actividades de IA", () => {
    expect(() =>
      parseActivitySpec({
        type: "open_response",
        title: "<script>alert(1)</script>",
        prompt: "Responde",
        responseLabel: "Respuesta",
        maxLength: 500,
      })
    ).toThrow();

    expect(() =>
      parseActivitySpec({
        type: "three_column",
        title: "Título",
        prompt: "Analiza <b>esto</b>",
        columns: [
          { key: "said", label: "Qué se dijo" },
          { key: "intended", label: "Qué se intentó hacer" },
          { key: "effect", label: "Qué efecto produjo" },
        ],
      })
    ).toThrow();
  });
});
