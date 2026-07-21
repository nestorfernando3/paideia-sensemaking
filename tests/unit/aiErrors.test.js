import { describe, expect, it } from "vitest";
import { AI_ERROR_MESSAGES, getOnlineSessionErrorMessage } from "../../src/utils/online-errors.js";

describe("AI error handling and resilience", () => {
  it("exporta mensajes accionables para los códigos de error conocidos de IA", () => {
    expect(AI_ERROR_MESSAGES.AUTH_REQUIRED).toBe("Vuelve a ingresar a la sesión.");
    expect(AI_ERROR_MESSAGES.TEACHER_REQUIRED).toBe(
      "Solo el docente de esta sesión puede solicitar este análisis."
    );
    expect(AI_ERROR_MESSAGES.FREE_MODEL_UNAVAILABLE).toBe(
      "No hay un modelo gratuito verificable disponible. La actividad continúa sin IA."
    );
    expect(AI_ERROR_MESSAGES.RATE_LIMITED).toBe(
      "Se alcanzó el límite de ayudas para esta etapa."
    );
    expect(AI_ERROR_MESSAGES.INVALID_MODEL_OUTPUT).toBe(
      "La IA no produjo un resultado verificable. No se aplicó ninguna recomendación."
    );
    expect(AI_ERROR_MESSAGES.ZEN_UNAVAILABLE).toBe(
      "El servicio de IA no está disponible. Continúa la clase y vuelve a intentarlo después."
    );
  });

  it("getOnlineSessionErrorMessage retorna mensaje amigable ante FREE_MODEL_UNAVAILABLE", () => {
    const msg = getOnlineSessionErrorMessage({ message: "FREE_MODEL_UNAVAILABLE" }, "analizar");
    expect(msg).toContain("No hay un modelo gratuito");
    expect(msg).not.toContain("GPT");
    expect(msg).not.toContain("OpenAI");
  });
});
