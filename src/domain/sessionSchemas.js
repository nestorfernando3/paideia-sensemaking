import { z } from "zod";

export const createSessionInputSchema = z
  .object({
    displayName: z.string().trim().min(1, "El nombre del docente es obligatorio").max(80),
    gradeLevel: z.string().trim().min(1, "El grado es obligatorio").max(30),
    topic: z.string().trim().min(3, "El tema debe tener al menos 3 caracteres").max(160),
    learningObjective: z
      .string()
      .trim()
      .min(10, "El objetivo de aprendizaje debe tener al menos 10 caracteres")
      .max(800),
    successCriteria: z
      .string()
      .trim()
      .min(10, "El criterio de éxito debe tener al menos 10 caracteres")
      .max(800),
    initialQuestion: z
      .string()
      .trim()
      .min(10, "La pregunta inicial debe tener al menos 10 caracteres")
      .max(800),
    allowFreeAiAssistance: z.boolean().default(false),
    allowCollectiveExternalAi: z.boolean().default(false),
    teacherAttestsAuthorization: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.allowCollectiveExternalAi && !data.teacherAttestsAuthorization) {
        return false;
      }
      return true;
    },
    {
      message: "Se requiere atestación de autorización docente para habilitar análisis colectivo",
      path: ["teacherAttestsAuthorization"],
    }
  );

export function parseCreateSessionInput(value) {
  return createSessionInputSchema.parse(value);
}
