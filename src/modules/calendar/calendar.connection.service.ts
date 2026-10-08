import type { CalendarProvider } from "@prisma/client";
import { db } from "@/core/db/client";
import { ConfigurationError, NotFoundError } from "@/lib/errors";
import { ensureFreshToken } from "@/core/oauth/token-refresh";
import { createGoogleCalendarClient } from "@/core/calendar/google.client";
import { createMicrosoftCalendarClient } from "@/core/calendar/microsoft.client";
import type { ExternalCalendarClient } from "@/core/calendar/calendar.client";

export type CalendarConnectionView = {
  provider: CalendarProvider;
  externalEmail: string;
  connectedAt: Date;
  lastUsedAt: Date | null;
  lastError: string | null;
};

function toView(row: {
  provider: CalendarProvider;
  externalEmail: string;
  connectedAt: Date;
  lastUsedAt: Date | null;
  lastError: string | null;
}): CalendarConnectionView {
  return {
    provider: row.provider,
    externalEmail: row.externalEmail,
    connectedAt: row.connectedAt,
    lastUsedAt: row.lastUsedAt,
    lastError: row.lastError,
  };
}

async function refreshGoogle(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("google_refresh_failed");
  return (await res.json()) as { access_token: string; expires_in: number };
}

async function refreshMicrosoft(refreshToken: string) {
  const res = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.MS_CALENDAR_CLIENT_ID ?? "",
        client_secret: process.env.MS_CALENDAR_CLIENT_SECRET ?? "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    }
  );
  if (!res.ok) throw new Error("ms_refresh_failed");
  return (await res.json()) as { access_token: string; expires_in: number };
}

export const CalendarConnectionService = {
  async list(tenantId: string, userId: string): Promise<CalendarConnectionView[]> {
    const rows = await db.userCalendarConnection.findMany({
      where: { tenantId, userId, deletedAt: null },
    });
    return rows.map(toView);
  },

  async get(
    tenantId: string,
    userId: string,
    provider: CalendarProvider
  ): Promise<CalendarConnectionView | null> {
    const row = await db.userCalendarConnection.findFirst({
      where: { tenantId, userId, provider, deletedAt: null },
    });
    return row ? toView(row) : null;
  },

  async upsert(
    tenantId: string,
    userId: string,
    input: {
      provider: CalendarProvider;
      externalAccountId: string;
      externalEmail: string;
      accessToken: string;
      refreshToken: string;
      tokenExpiresAt: Date;
      scopes: string;
    }
  ): Promise<CalendarConnectionView> {
    const existing = await db.userCalendarConnection.findFirst({
      where: { tenantId, userId, provider: input.provider, deletedAt: null },
    });
    if (existing) {
      const updated = await db.userCalendarConnection.update({
        where: { id: existing.id },
        data: {
          externalAccountId: input.externalAccountId,
          externalEmail: input.externalEmail,
          accessToken: input.accessToken,
          refreshToken: input.refreshToken,
          tokenExpiresAt: input.tokenExpiresAt,
          scopes: input.scopes,
          lastError: null,
          deletedAt: null,
        },
      });
      return toView(updated);
    }
    const created = await db.userCalendarConnection.create({
      data: {
        tenantId,
        userId,
        provider: input.provider,
        externalAccountId: input.externalAccountId,
        externalEmail: input.externalEmail,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        tokenExpiresAt: input.tokenExpiresAt,
        scopes: input.scopes,
      },
    });
    return toView(created);
  },

  async disconnect(
    tenantId: string,
    userId: string,
    provider: CalendarProvider
  ): Promise<void> {
    await db.userCalendarConnection.updateMany({
      where: { tenantId, userId, provider, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },

  async getAuthorizedClient(
    tenantId: string,
    userId: string,
    provider: CalendarProvider
  ): Promise<{ client: ExternalCalendarClient; accessToken: string }> {
    const row = await db.userCalendarConnection.findFirst({
      where: { tenantId, userId, provider, deletedAt: null },
    });
    if (!row) {
      throw new ConfigurationError(
        `No ${provider} calendar connected. Connect at /settings/calendar.`
      );
    }

    const refresh =
      provider === "GOOGLE"
        ? () => refreshGoogle(row.refreshToken)
        : () => refreshMicrosoft(row.refreshToken);

    const fresh = await ensureFreshToken({
      accessToken: row.accessToken,
      tokenExpiresAt: row.tokenExpiresAt,
      refresh,
    });

    if (fresh.refreshed) {
      await db.userCalendarConnection.update({
        where: { id: row.id },
        data: {
          accessToken: fresh.accessToken,
          tokenExpiresAt: fresh.tokenExpiresAt,
          lastUsedAt: new Date(),
        },
      });
    } else {
      await db.userCalendarConnection.update({
        where: { id: row.id },
        data: { lastUsedAt: new Date() },
      });
    }

    const client =
      provider === "GOOGLE"
        ? createGoogleCalendarClient()
        : createMicrosoftCalendarClient();

    return { client, accessToken: fresh.accessToken };
  },
};
