import { assertRateLimit } from "@/core/security/rate-limit";
import { RateLimitError } from "@/lib/errors";
import { NextRequest } from "next/server";
import { requireSession } from "@/core/auth/session";
import { googleAuthUrl, microsoftAuthUrl } from "@/core/drive/drive.client";
import { signState } from "@/core/oauth/state";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

function canConnectDrive(role: string | undefined): boolean {
  return role === "TENANT_ADMIN";
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  try {
    const session = await requireSession();
  try {
    await assertRateLimit("api:oauth-start", session.user.id);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return new Response("Too many requests", {
        status: 429,
        headers: { "Retry-After": "3600" },
      });
    }
    throw error;
  }
    if (!canConnectDrive(session.user.role)) {
      return new Response("Forbidden", { status: 403 });
    }
    const { provider } = await context.params;
    if (provider !== "google" && provider !== "microsoft") {
      return new Response("Unknown provider", { status: 404 });
    }
    const tenantId = session.user.tenantId || session.tenantId;
    if (!tenantId) return new Response("Missing tenant", { status: 400 });
    const state = signState({
      tenantId,
      userId: session.user.id,
      provider,
      nonce: crypto.randomUUID(),
    });
    const url = provider === "google" ? googleAuthUrl(state) : microsoftAuthUrl(state);
    return Response.redirect(url);
  } catch (err) {
    if (err instanceof UnauthorizedError) return new Response("Unauthorized", { status: 401 });
    if (err instanceof ForbiddenError) return new Response("Forbidden", { status: 403 });
    throw err;
  }
}
