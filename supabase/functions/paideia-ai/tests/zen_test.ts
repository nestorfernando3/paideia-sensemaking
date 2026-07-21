import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  DEFAULT_ORDERED_ALLOWLIST,
  extractJsonObject,
  selectFreeModels,
} from "../../_shared/modelRegistry.ts";

Deno.test("el allowlist runtime contiene únicamente los tres modelos gratuitos aprobados", () => {
  assertEquals(DEFAULT_ORDERED_ALLOWLIST, [
    "nemotron-3-ultra-free",
    "deepseek-v4-flash-free",
    "mimo-v2.5-free",
  ]);
});

Deno.test("selectFreeModels cruza disponibilidad y costo sin reordenar", () => {
  const now = Date.now();
  const availability = {
    fetchedAt: now,
    data: new Set(["mimo-v2.5-free", "hy3-free", "nemotron-3-ultra-free"]),
  };
  const costs = {
    fetchedAt: now,
    data: {
      "nemotron-3-ultra-free": { input: 0, output: 0 },
      "hy3-free": { input: 0, output: 0 },
      "mimo-v2.5-free": { input: 0, output: 0 },
    },
  };

  assertEquals(
    selectFreeModels({
      availability,
      costs,
      orderedAllowlist: [
        "nemotron-3-ultra-free",
        "hy3-free",
        "deepseek-v4-flash-free",
        "mimo-v2.5-free",
      ],
      zenPublicPriceConfirmedIds: new Set([
        "nemotron-3-ultra-free",
        "deepseek-v4-flash-free",
        "mimo-v2.5-free",
      ]),
      now,
    }),
    ["nemotron-3-ultra-free", "mimo-v2.5-free"],
  );
});

Deno.test("selectFreeModels falla cerrado ante snapshot vencido", () => {
  const now = Date.now();
  assertEquals(
    selectFreeModels({
      availability: {
        fetchedAt: now - 300_001,
        data: new Set(["nemotron-3-ultra-free"]),
      },
      costs: {
        fetchedAt: now,
        data: { "nemotron-3-ultra-free": { input: 0, output: 0 } },
      },
      orderedAllowlist: ["nemotron-3-ultra-free"],
      zenPublicPriceConfirmedIds: new Set(["nemotron-3-ultra-free"]),
      now,
    }),
    [],
  );
});

Deno.test("extractJsonObject extrae objeto JSON limpio de bloques de texto o markdown", () => {
  const raw =
    'Aquí está la respuesta:\n```json\n{\n  "status": "advance"\n}\n```\nGracias.';
  const extracted = extractJsonObject(raw);
  assertEquals(extracted, { status: "advance" });
});
