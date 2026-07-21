import { z } from "zod";

const noHtmlString = z.string().refine((str) => !/[<>]/.test(str), {
  message: "String must not contain HTML or angle brackets (< or >)",
});

export const openResponseSchema = z.object({
  type: z.literal("open_response"),
  title: noHtmlString,
  prompt: noHtmlString,
  responseLabel: noHtmlString,
  maxLength: z.number().int().positive(),
});

export const threeColumnSchema = z.object({
  type: z.literal("three_column"),
  title: noHtmlString,
  prompt: noHtmlString,
  columns: z.tuple([
    z.object({ key: z.literal("said"), label: noHtmlString }),
    z.object({ key: z.literal("intended"), label: noHtmlString }),
    z.object({ key: z.literal("effect"), label: noHtmlString }),
  ]),
});

export const transferJustificationSchema = z.object({
  type: z.literal("transfer_justification"),
  title: noHtmlString,
  caseText: noHtmlString,
  fields: z.tuple([
    z.object({ key: z.literal("said"), label: noHtmlString }),
    z.object({ key: z.literal("intended"), label: noHtmlString }),
    z.object({ key: z.literal("effect"), label: noHtmlString }),
    z.object({ key: z.literal("justification"), label: noHtmlString }),
  ]),
});

export const activitySpecSchema = z.discriminatedUnion("type", [
  openResponseSchema,
  threeColumnSchema,
  transferJustificationSchema,
]);

/**
 * Parses and validates an activity specification object.
 * @param {unknown} value
 * @returns {import('./activitySchemas').ActivitySpec}
 */
export function parseActivitySpec(value) {
  return activitySpecSchema.parse(value);
}
