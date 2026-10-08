import { validateOrigin } from "@/core/security/origin";

/** Returns a 403 Response when Origin does not match Host; null when OK. */
export function requireOrigin(req: Request): Response | null {
  if (!validateOrigin(req)) {
    return new Response("Forbidden: origin mismatch", { status: 403 });
  }
  return null;
}
