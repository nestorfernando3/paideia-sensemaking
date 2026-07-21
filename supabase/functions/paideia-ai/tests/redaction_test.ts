import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { redactObjectPII, createEphemeralPseudonymMap } from "../../_shared/redaction.ts";

Deno.test("redactObjectPII elimina correos y teléfonos y trunca textos largos", () => {
  const input = {
    studentComment: "Hola soy Juan, mail juan@test.com o cel 3001234567. " + "x".repeat(3000),
    responses: [
      { id: "r1", text: "Escríbeme a maria@example.com para la tarea" },
    ],
  };

  const redacted = redactObjectPII(input) as typeof input;
  assertEquals(redacted.studentComment.includes("juan@test.com"), false);
  assertEquals(redacted.studentComment.includes("3001234567"), false);
  assertEquals(redacted.studentComment.includes("[EMAIL]"), true);
  assertEquals(redacted.studentComment.includes("[PHONE]"), true);
  assertEquals(redacted.studentComment.length <= 2000, true);
  assertEquals(redacted.responses[0].text.includes("[EMAIL]"), true);
});

Deno.test("createEphemeralPseudonymMap reemplaza IDs reales por alias aleatorios learner_01, learner_02", () => {
  const userIds = ["usr_real_99", "usr_real_88"];
  const map1 = createEphemeralPseudonymMap(userIds);
  
  assertEquals(Object.keys(map1).length, 2);
  assertEquals(typeof map1["usr_real_99"], "string");
  assertEquals(map1["usr_real_99"].startsWith("learner_"), true);

  // Un nuevo mapa genera alias independientes y efímeros
  const map2 = createEphemeralPseudonymMap(userIds);
  assertNotEquals(map1["usr_real_99"], map2["usr_real_99"]);
});
