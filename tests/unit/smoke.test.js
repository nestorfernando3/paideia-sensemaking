import { describe, expect, it } from "vitest";

describe("Paideia Sensemaking", () => {
  it("expone un nombre de producto independiente", async () => {
    const pkg = await import("../../package.json");
    expect(pkg.default.name).toBe("paideia-sensemaking");
  });
});
