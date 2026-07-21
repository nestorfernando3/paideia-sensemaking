import { describe, expect, it } from "vitest";
import { renderAssistantPanel, renderAssistantError } from "../../src/components/assistantPanel.js";

describe("assistantPanel", () => {
  it("no aparece cuando la sesión no habilitó asistencia gratuita", () => {
    expect(renderAssistantPanel({ enabled: false })).toBe("");
  });

  it("muestra solo tres ayudas al estudiante", () => {
    const html = renderAssistantPanel({ enabled: true, role: "student" });
    expect(html).toContain("Dame una pista");
    expect(html).toContain("Explícalo de otra forma");
    expect(html).toContain("Muéstrame un ejemplo parecido");
    expect(html).not.toContain("Escribe cualquier pregunta");
  });

  it("no ofrece un modelo pago como fallback ante error de modelo no disponible", () => {
    const html = renderAssistantError("FREE_MODEL_UNAVAILABLE");
    expect(html).toContain("No hay un modelo gratuito disponible");
    expect(html).not.toContain("usaremos GPT");
    expect(html).not.toContain("OpenAI");
  });
});
