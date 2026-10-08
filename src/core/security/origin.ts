/**
 * Origin check for mutating custom /api routes.
 * Server actions are protected by Next.js; webhooks use signature auth and skip this.
 */
export function validateOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function requireValidOrigin(req: Request): void {
  if (!validateOrigin(req)) {
    const err = new Error("Invalid origin");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}
