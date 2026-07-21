/**
 * Extract and parse the first JSON object structure from raw text response.
 */
export function extractJsonObject(raw: string): unknown {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("EMPTY_RESPONSE");
  }

  // Strip markdown code block wrappers if present
  let cleaned = raw.trim();
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    cleaned = jsonBlockMatch[1].trim();
  }

  const startIdx = cleaned.indexOf("{");
  const endIdx = cleaned.lastIndexOf("}");

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error("NO_JSON_OBJECT_FOUND");
  }

  const jsonStr = cleaned.slice(startIdx, endIdx + 1);
  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    throw new Error(`INVALID_JSON_SYNTAX: ${(err as Error).message}`);
  }
}
