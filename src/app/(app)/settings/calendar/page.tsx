import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { CalendarConnectionService } from "@/modules/calendar/calendar.connection.service";
import { disconnectCalendarAction } from "./actions";

type Props = { searchParams: Promise<{ connected?: string }> };

export default async function CalendarSettingsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return <main className="p-8">Missing tenant</main>;

  const connections = await withTenant(tenantId, () =>
    CalendarConnectionService.list(tenantId, session.user.id)
  );
  const google = connections.find((c) => c.provider === "GOOGLE");
  const ms = connections.find((c) => c.provider === "MICROSOFT");

  return (
    <main className="mx-auto grid max-w-xl gap-4 p-4 sm:p-8">
      <h1 className="text-xl font-semibold">Calendar connections</h1>
      {sp.connected === "1" ? (
        <p className="text-sm text-green-700">Calendar connected.</p>
      ) : null}
      <section className="rounded border p-3 text-sm">
        <h2 className="font-medium">Google Calendar</h2>
        <p>{google ? google.externalEmail : "Not connected"}</p>
        {google ? (
          <form action={disconnectCalendarAction}>
            <input type="hidden" name="provider" value="GOOGLE" />
            <button type="submit" className="mt-2 rounded border px-3 py-1">
              Disconnect
            </button>
          </form>
        ) : (
          <a className="mt-2 inline-block underline" href="/api/oauth/calendar/google">
            Connect Google
          </a>
        )}
      </section>
      <section className="rounded border p-3 text-sm">
        <h2 className="font-medium">Microsoft Outlook</h2>
        <p>{ms ? ms.externalEmail : "Not connected"}</p>
        {ms ? (
          <form action={disconnectCalendarAction}>
            <input type="hidden" name="provider" value="MICROSOFT" />
            <button type="submit" className="mt-2 rounded border px-3 py-1">
              Disconnect
            </button>
          </form>
        ) : (
          <a className="mt-2 inline-block underline" href="/api/oauth/calendar/microsoft">
            Connect Microsoft
          </a>
        )}
      </section>
      <Link href="/admin/sms" className="text-sm underline">
        SMS quota
      </Link>
    </main>
  );
}
