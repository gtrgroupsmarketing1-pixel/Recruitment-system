import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { verifyState } from "@/core/oauth/state";
import { CalendarConnectionService } from "@/modules/calendar/calendar.connection.service";

async function exchangeGoogle(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET ?? "",
      redirect_uri: process.env.GOOGLE_CALENDAR_REDIRECT_URI ?? "",
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error("google_token_exchange_failed");
  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  const me = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${json.access_token}` },
  });
  const profile = (await me.json()) as { id?: string; email?: string };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? "",
    expiresIn: json.expires_in,
    externalAccountId: String(profile.id ?? ""),
    externalEmail: String(profile.email ?? ""),
  };
}

async function exchangeMicrosoft(code: string) {
  const res = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.MS_CALENDAR_CLIENT_ID ?? "",
        client_secret: process.env.MS_CALENDAR_CLIENT_SECRET ?? "",
        redirect_uri: process.env.MS_CALENDAR_REDIRECT_URI ?? "",
        grant_type: "authorization_code",
      }),
    }
  );
  if (!res.ok) throw new Error("ms_token_exchange_failed");
  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  const me = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${json.access_token}` },
  });
  const profile = (await me.json()) as {
    id?: string;
    mail?: string;
    userPrincipalName?: string;
  };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? "",
    expiresIn: json.expires_in,
    externalAccountId: String(profile.id ?? ""),
    externalEmail: String(profile.mail ?? profile.userPrincipalName ?? ""),
  };
}

export async function GET(
  req: Request,
  context: { params: Promise<{ provider: string }> }
) {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return new Response("Missing tenant", { status: 401 });
  const { provider } = await context.params;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return new Response("Missing code/state", { status: 400 });
  const claims = verifyState(state);
  if (!claims || claims.tenantId !== tenantId || claims.userId !== session.user.id) {
    return new Response("Invalid state", { status: 400 });
  }

  const tokens =
    provider === "google"
      ? await exchangeGoogle(code)
      : await exchangeMicrosoft(code);

  await withTenant(tenantId, () =>
    CalendarConnectionService.upsert(tenantId, session.user.id, {
      provider: provider === "google" ? "GOOGLE" : "MICROSOFT",
      externalAccountId: tokens.externalAccountId,
      externalEmail: tokens.externalEmail,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
      scopes:
        provider === "google"
          ? "calendar.events calendar.readonly"
          : "Calendars.ReadWrite",
    })
  );

  return Response.redirect(new URL("/settings/calendar?connected=1", req.url));
}
