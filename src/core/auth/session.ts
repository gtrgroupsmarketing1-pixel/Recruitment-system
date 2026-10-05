import { auth } from "@/core/auth/auth.config";
import { UnauthorizedError } from "@/lib/errors";

export async function getSession() {
  return auth();
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user || !session.tenantId) {
    throw new UnauthorizedError();
  }
  return session;
}

/** Stub. Real RBAC is Session 23. Returns the user without checking role. */
export async function requireRole(_role: string) {
  return requireSession();
}
