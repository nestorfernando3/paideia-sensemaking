import { describe, expect, it } from "vitest";
import { renderActivity } from "../../src/components/activityRenderer.js";

describe("renderActivity", () => {
  it("renderiza una actividad de respuesta abierta", () => {
    const html = renderActivity({
      type: "open_response",
      title: "Respuesta Inicial",
      prompt: "¿Qué quiso decir?",
      responseLabel: "Tu respuesta",
      maxLength: 500,
    });

    expect(html).toContain("Respuesta Inicial");
    expect(html).toContain("¿Qué quiso decir?");
    expect(html).toContain('name="response"');
    expect(html).toContain('maxlength="500"');
  });

  it("renderiza tres campos semánticos para three_column", () => {
    const html = renderActivity({
      type: "three_column",
      title: "Distingue los actos",
      prompt: "Analiza: Hace frío aquí",
      columns: [
        { key: "said", label: "Qué se dijo" },
        { key: "intended", label: "Qué se intentó hacer" },
        { key: "effect", label: "Qué efecto produjo" },
      ],
    });

    expect(html).toContain('name="said"');
    expect(html).toContain('name="intended"');
    expect(html).toContain('name="effect"');
    expect(html).toContain("Qué se dijo");
    expect(html).toContain("Qué se intentó hacer");
    expect(html).toContain("Qué efecto produjo");
  });

  it("renderiza caso de transferencia y 4 campos para transfer_justification", () => {
    const html = renderActivity({
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

    expect(html).toContain("Un docente dice");
    expect(html).toContain("Hace calor aquí");
    expect(html).toContain('name="said"');
    expect(html).toContain('name="intended"');
    expect(html).toContain('name="effect"');
    expect(html).toContain('name="justification"');
  });
});
