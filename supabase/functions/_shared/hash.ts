export async function computeSha256(data: unknown): Promise<string> {
  const jsonStr = JSON.stringify(data ?? {});
  const encoder = new TextEncoder();
  const buffer = encoder.encode(jsonStr);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
