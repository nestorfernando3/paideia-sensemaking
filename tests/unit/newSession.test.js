import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseCreateSessionInput } from "../../src/domain/sessionSchemas.js";

describe("seguridad docente y validación de creación de sesión", () => {
  it("no incluye la contraseña literal heredada 'paideia'", () => {
    const source = readFileSync("src/views/newSession.js", "utf8");
    expect(source).not.toContain("teacherCode !== 'paideia'");
    expect(source).not.toContain("Código de acceso docente");
  });

  it("valida entradas válidas de creación de sesión", () => {
    const valid = parseCreateSessionInput({
      displayName: "Profesor Juan",
      gradeLevel: "10°",
      topic: "Actos de habla",
      learningObjective: "Diferenciar entre lo que se dice y la intención implícita",
      successCriteria: "Identifica correctamente el acto ilocutivo en 3 ejemplos",
      initialQuestion: "Si alguien dice '¿Tienes hora?', ¿qué está pidiendo realmente?",
      allowFreeAiAssistance: true,
      allowCollectiveExternalAi: true,
      teacherAttestsAuthorization: true,
    });

    expect(valid.displayName).toBe("Profesor Juan");
    expect(valid.allowCollectiveExternalAi).toBe(true);
  });

  it("impide activar análisis colectivo sin atestación docente de autorización", () => {
    expect(() =>
      parseCreateSessionInput({
        displayName: "Profesor Juan",
        gradeLevel: "10°",
        topic: "Actos de habla",
        learningObjective: "Diferenciar entre lo que se dice y la intención implícita",
        successCriteria: "Identifica correctamente el acto ilocutivo en 3 ejemplos",
        initialQuestion: "Si alguien dice '¿Tienes hora?', ¿qué está pidiendo realmente?",
        allowFreeAiAssistance: true,
        allowCollectiveExternalAi: true,
        teacherAttestsAuthorization: false,
      })
    ).toThrow("Se requiere atestación");
  });

  it("ambos modos de IA nacen desactivados por defecto", () => {
    const defaultData = parseCreateSessionInput({
      displayName: "Profesor Juan",
      gradeLevel: "10°",
      topic: "Actos de habla",
      learningObjective: "Diferenciar entre lo que se dice y la intención implícita",
      successCriteria: "Identifica correctamente el acto ilocutivo en 3 ejemplos",
      initialQuestion: "Si alguien dice '¿Tienes hora?', ¿qué está pidiendo realmente?",
    });

    expect(defaultData.allowFreeAiAssistance).toBe(false);
    expect(defaultData.allowCollectiveExternalAi).toBe(false);
    expect(defaultData.teacherAttestsAuthorization).toBe(false);
  });
});
