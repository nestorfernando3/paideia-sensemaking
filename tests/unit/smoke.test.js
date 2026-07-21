import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Paideia Sensemaking", () => {
  it("expone un nombre de producto independiente", async () => {
    const pkg = await import("../../package.json");
    expect(pkg.default.name).toBe("paideia-sensemaking");
  });

  it("publica sus enlaces en el repositorio independiente", async () => {
    const pkg = await import("../../package.json");
    const repository = "https://github.com/nestorfernando3/paideia-sensemaking";

    expect(pkg.default.homepage).toBe(repository);
    expect(pkg.default.bugs.url).toBe(`${repository}/issues`);
    expect(pkg.default.repository.url).toBe(`${repository}.git`);
  });

  it("inicializa el router una sola vez", () => {
    const source = readFileSync("src/main.js", "utf8");
    expect(source).not.toContain("DOMContentLoaded");
    expect(source).toContain("if (window.location.hash)");
  });
});
