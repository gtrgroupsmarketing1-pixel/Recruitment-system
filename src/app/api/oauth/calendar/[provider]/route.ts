// OAuth start/callback — provider redirect; Origin check exempt (callback from IdP).
import { assertRateLimit } from "@/core/security/rate-limit";
import { RateLimitError } from "@/lib/errors";
import { randomBytes } from "node:crypto";
import { requireSession } from "@/core/auth/session";
import { signState } from "@/core/oauth/state";
import { googleCalendarAuthUrl } from "@/core/calendar/google.client";
import { microsoftCalendarAuthUrl } from "@/core/calendar/microsoft.client";

export async function GET(
  _req: Request,
  context: { params: Promise<{ provider: string }> }
) {
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
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return new Response("Missing tenant", { status: 401 });
  const { provider } = await context.params;
  if (provider !== "google" && provider !== "microsoft") {
    return new Response("Unknown provider", { status: 404 });
  }
  const state = signState({
    tenantId,
    userId: session.user.id,
    provider,
    nonce: randomBytes(8).toString("hex"),
  });
  const url =
    provider === "google"
      ? googleCalendarAuthUrl(state)
      : microsoftCalendarAuthUrl(state);
  return Response.redirect(url);
}
