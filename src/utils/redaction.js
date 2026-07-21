const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?:\+?57[\s.-]?)?(?:3\d{2})[\s.-]?\d{3}[\s.-]?\d{4}\b/g;

/**
 * Redact sensitive PII (emails and phone numbers) from text and truncate length.
 * @param {string} value
 * @param {number} [maxLength=2000]
 * @returns {string}
 */
export function redactSensitiveText(value, maxLength = 2000) {
  if (value === null || value === undefined) {
    return "";
  }
  const strValue = String(value);
  return strValue
    .replace(EMAIL_PATTERN, "[EMAIL]")
    .replace(PHONE_PATTERN, "[PHONE]")
    .slice(0, maxLength);
}
