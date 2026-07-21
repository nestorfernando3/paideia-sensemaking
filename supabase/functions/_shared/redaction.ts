const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?:\+?57[\s.-]?)?(?:3\d{2})[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const SENSITIVE_KEYS = new Set([
  "authid",
  "code",
  "displayname",
  "email",
  "joincode",
  "memberid",
  "name",
  "phone",
  "studentid",
  "userid",
]);

export function redactText(text: string, maxLength = 2000): string {
  if (typeof text !== "string") return "";
  return text
    .replace(EMAIL_PATTERN, "[EMAIL]")
    .replace(PHONE_PATTERN, "[PHONE]")
    .replace(UUID_PATTERN, "[ID]")
    .slice(0, maxLength);
}

export function redactObjectPII(val: unknown, maxLength = 2000): unknown {
  if (typeof val === "string") {
    return redactText(val, maxLength);
  }
  if (Array.isArray(val)) {
    return val.map((item) => redactObjectPII(item, maxLength));
  }
  if (val !== null && typeof val === "object") {
    const res: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k.replace(/[^a-z0-9]/gi, "").toLowerCase())) {
        continue;
      }
      res[k] = redactObjectPII(v, maxLength);
    }
    return res;
  }
  return val;
}

export function createEphemeralPseudonymMap(
  userIds: string[],
): Record<string, string> {
  const map: Record<string, string> = {};
  const shuffled = [...userIds].sort(() => Math.random() - 0.5);

  shuffled.forEach((id, idx) => {
    const numStr = String(idx + 1).padStart(2, "0");
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    map[id] = `learner_${numStr}_${randomSuffix}`;
  });

  return map;
}
