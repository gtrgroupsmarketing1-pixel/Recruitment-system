import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { NotificationService } from "@/modules/notification/notification.service";
import type { NotificationStatus } from "@prisma/client";

type Props = {
  searchParams: Promise<{
    status?: string;
    templateKey?: string;
  }>;
};

const STATUSES: NotificationStatus[] = [
  "QUEUED",
  "SENT",
  "DELIVERED",
  "FAILED",
  "BOUNCED",
  "SKIPPED",
];

function maskAddr(addr: string): string {
  const at = addr.indexOf("@");
  if (at <= 1) return "***";
  return `${addr.slice(0, 1)}***${addr.slice(at)}`;
}

export default async function NotificationsAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) {
    return <main className="p-8">Missing tenant</main>;
  }

  const status =
    sp.status && STATUSES.includes(sp.status as NotificationStatus)
      ? (sp.status as NotificationStatus)
      : undefined;
  const templateKey = sp.templateKey || undefined;

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
  const [rows, bounces] = await withSessionScope(async (_scope) => {
    const list = await NotificationService.listForTenant(tenantId, {
      status,
      templateKey,
      limit: 200,
    });
    const hard = await NotificationService.listHardBounces(tenantId, sevenDaysAgo);
    return [list, hard] as const;
  });

  return (
    <main className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notification delivery log</h1>
        <Link href="/admin/notifications/preview" className="text-sm underline">
          Preview
        </Link>
        <Link href="/admin/email-config" className="text-sm underline">
          Sender
        </Link>
        <Link href="/" className="text-sm underline">
          Home
        </Link>
      </div>

      {bounces.length > 0 ? (
        <section className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="font-medium">
            {bounces.length} hard bounce{bounces.length === 1 ? "" : "s"} in last 7 days
          </p>
          <ul className="mt-2 space-y-1">
            {bounces.slice(0, 3).map((b) => (
              <li key={b.id}>
                {maskAddr(b.recipientAddr)} | {b.templateKey} | {b.bounceReason ?? "—"}
              </li>
            ))}
          </ul>
          <Link href="/admin/notifications?status=BOUNCED" className="underline">
            View all
          </Link>
        </section>
      ) : null}

      <form method="get" className="flex flex-wrap gap-2 text-sm">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded border px-2 py-1"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          name="templateKey"
          defaultValue={templateKey ?? ""}
          placeholder="template key"
          className="rounded border px-2 py-1"
        />
        <button type="submit" className="rounded bg-black px-3 py-1 text-white">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-start text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 pe-2">Time</th>
              <th className="py-2 pe-2">Channel</th>
              <th className="py-2 pe-2">Template</th>
              <th className="py-2 pe-2">Recipient</th>
              <th className="py-2 pe-2">Status</th>
              <th className="py-2 pe-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  No notifications yet
                </td>
              </tr>
            ) : (
              rows.map((n) => (
                <tr key={n.id} className="border-b">
                  <td className="py-2 pe-2 whitespace-nowrap">
                    {n.createdAt.toISOString().slice(0, 19)}Z
                  </td>
                  <td className="py-2 pe-2">{n.channel}</td>
                  <td className="py-2 pe-2">{n.templateKey}</td>
                  <td className="py-2 pe-2">
                    {n.recipientType}
                    {n.recipientId ? ` / ${n.recipientId.slice(0, 8)}` : ""}
                  </td>
                  <td className="py-2 pe-2">{n.status}</td>
                  <td className="py-2 pe-2">
                    <Link
                      href={`/admin/notifications/${n.id}`}
                      className="underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
