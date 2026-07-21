/**
 * Synthetic test fixtures for Speech Acts MVP testing.
 * All entries are synthetic, un-identified, and strictly for test verification.
 */
export const syntheticSpeechActsResponses = [
  {
    responseId: "resp-syn-01",
    payload: { response: "Dijo que tenía frío en el salón." },
    category: "literal_reading",
  },
  {
    responseId: "resp-syn-02",
    payload: { response: "Solo está informando sobre la temperatura ambiental." },
    category: "literal_reading",
  },
  {
    responseId: "resp-syn-03",
    payload: { response: "Se refiere literalmente al clima del espacio." },
    category: "literal_reading",
  },
  {
    responseId: "resp-syn-04",
    payload: { response: "Intenta pedir sutilmente que alguien cierre la ventana que está abierta." },
    category: "correctly_inferred_intention",
  },
  {
    responseId: "resp-syn-05",
    payload: { response: "Busca que un estudiante se levante y cierre la puerta sin dar una orden directa." },
    category: "correctly_inferred_intention",
  },
  {
    responseId: "resp-syn-06",
    payload: { response: "Es una petición indirecta para modificar el entorno del aula." },
    category: "correctly_inferred_intention",
  },
  {
    responseId: "resp-syn-07",
    payload: { response: "El efecto fue que Juan sintió pena y se paró rápido." },
    category: "confusion_intention_effect",
  },
  {
    responseId: "resp-syn-08",
    payload: { response: "Lo que hizo fue asustar a los estudiantes para que guardaran silencio." },
    category: "confusion_intention_effect",
  },
  {
    responseId: "resp-syn-09",
    payload: { response: "A mí me pasó ayer en mi casa con mi mamá cuando hacía viento." },
    category: "personal_experience_unconnected",
  },
  {
    responseId: "resp-syn-10",
    payload: { response: "Recuerdo cuando fuimos al campo y hacía mucho frío de noche." },
    category: "personal_experience_unconnected",
  },
  {
    responseId: "resp-syn-11",
    payload: { response: "No sé." },
    category: "insufficient_evidence",
  },
  {
    responseId: "resp-syn-12",
    payload: { response: "Ok" },
    category: "insufficient_evidence",
  },
];
