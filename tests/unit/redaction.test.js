import { describe, expect, it } from "vitest";
import { redactSensitiveText } from "../../src/utils/redaction.js";

describe("redactSensitiveText", () => {
  it("elimina correo y teléfono sin alterar el contenido conceptual", () => {
    expect(
      redactSensitiveText(
        "Soy Ana, escríbeme a ana@example.com o al 300 123 4567. Creo que pide cerrar la ventana."
      )
    ).toBe(
      "Soy Ana, escríbeme a [EMAIL] o al [PHONE]. Creo que pide cerrar la ventana."
    );
  });

  it("elimina teléfonos colombianos en diversos formatos", () => {
    expect(redactSensitiveText("Mi num es +57 300-123-4567 y el de el es 312 987 6543")).toBe(
      "Mi num es [PHONE] y el de el es [PHONE]"
    );
  });

  it("limita el texto a 2000 caracteres por defecto", () => {
    expect(redactSensitiveText("a".repeat(2200))).toHaveLength(2000);
  });

  it("permite personalizar maxLength", () => {
    expect(redactSensitiveText("abcdefghij", 5)).toBe("abcde");
  });

  it("maneja nulos, undefined y no strings adecuadamente", () => {
    expect(redactSensitiveText(null)).toBe("");
    expect(redactSensitiveText(undefined)).toBe("");
    expect(redactSensitiveText(12345)).toBe("12345");
  });
});
