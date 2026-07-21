export function extractBearerToken(req: Request): string {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader) {
    throw new Error("MISSING_AUTH_HEADER");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    throw new Error("INVALID_AUTH_HEADER_FORMAT");
  }

  return parts[1];
}

export function parseJwtSubject(jwtToken: string): string {
  try {
    const parts = jwtToken.split(".");
    if (parts.length !== 3) throw new Error("INVALID_JWT_FORMAT");

    const payloadJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson) as { sub?: string };

    if (!payload.sub) {
      throw new Error("JWT_MISSING_SUB");
    }

    return payload.sub;
  } catch (err) {
    throw new Error(`JWT_DECODE_FAILED: ${(err as Error).message}`);
  }
}
