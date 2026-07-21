import { z } from "zod";
import { activitySpecSchema } from "./activitySchemas.js";

const noHtmlString = z.string().refine((str) => !/[<>]/.test(str), {
  message: "String must not contain HTML or angle brackets (< or >)",
});

export const stageAnalysisSchema = z.object({
  summary: noHtmlString,
  participation: z.object({
    submitted: z.number().int().nonnegative(),
    expected: z.number().int().nonnegative().nullable(),
  }),
  patterns: z.array(
    z.object({
      key: noHtmlString,
      label: noHtmlString,
      description: noHtmlString,
      responseIds: z.array(noHtmlString),
      evidence: z.array(
        z.object({
          responseId: noHtmlString,
          excerpt: noHtmlString,
        })
      ),
    })
  ),
  limitations: z.array(noHtmlString),
  readiness: z.object({
    status: z.enum(["advance", "intervene", "insufficient_evidence"]),
    rationale: noHtmlString,
  }),
  options: z.array(
    z.object({
      key: noHtmlString,
      title: noHtmlString,
      rationale: noHtmlString,
      activity: activitySpecSchema,
    })
  ),
});

export const learningComparisonSchema = z.object({
  summary: noHtmlString,
  observedChanges: z.array(
    z.object({
      label: noHtmlString,
      description: noHtmlString,
      initialEvidenceIds: z.array(noHtmlString),
      transferEvidenceIds: z.array(noHtmlString),
    })
  ),
  persistentDifficulties: z.array(
    z.object({
      label: noHtmlString,
      description: noHtmlString,
      responseIds: z.array(noHtmlString),
    })
  ),
  limitations: z.array(noHtmlString),
  recommendation: z.object({
    status: z.enum(["advance", "reinforce", "insufficient_evidence"]),
    rationale: noHtmlString,
  }),
});

export const userAssistanceSchema = z.object({
  intent: z.enum(["hint", "rephrase", "example", "rewrite_instruction"]),
  message: noHtmlString,
  nextAction: noHtmlString,
  boundaryNotice: noHtmlString.optional(),
  model: noHtmlString,
  isFreeModel: z.literal(true),
});

export function parseStageAnalysis(value) {
  return stageAnalysisSchema.parse(value);
}

export function parseLearningComparison(value) {
  return learningComparisonSchema.parse(value);
}

export function parseUserAssistance(value) {
  return userAssistanceSchema.parse(value);
}
