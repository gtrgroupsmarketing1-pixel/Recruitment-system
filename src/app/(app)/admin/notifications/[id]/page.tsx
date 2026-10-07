import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { NotificationService } from "@/modules/notification/notification.service";
import { retryNotificationAction } from "./retry.action";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NotificationDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) {
    return <main className="p-8">Missing tenant</main>;
  }

  const n = await withTenant(tenantId, () =>
    NotificationService.getById(tenantId, id)
  );

  return (
    <main className="mx-auto grid max-w-2xl gap-4 p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notification</h1>
        <Link href="/admin/notifications" className="text-sm underline">
          Back to log
        </Link>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="font-medium">ID</dt>
        <dd className="font-mono text-xs">{n.id}</dd>
        <dt className="font-medium">Channel</dt>
        <dd>{n.channel}</dd>
        <dt className="font-medium">Status</dt>
        <dd>{n.status}</dd>
        <dt className="font-medium">Template</dt>
        <dd>{n.templateKey}</dd>
        <dt className="font-medium">Recipient type</dt>
        <dd>{n.recipientType}</dd>
        <dt className="font-medium">Recipient id</dt>
        <dd className="font-mono text-xs">{n.recipientId ?? "—"}</dd>
        <dt className="font-medium">Address</dt>
        <dd className="font-mono text-xs">{n.recipientAddr}</dd>
        <dt className="font-medium">Subject</dt>
        <dd>{n.subject ?? "—"}</dd>
        <dt className="font-medium">Provider id</dt>
        <dd className="font-mono text-xs">{n.providerId ?? "—"}</dd>
        <dt className="font-medium">Sent at</dt>
        <dd>{n.sentAt ? n.sentAt.toISOString() : "—"}</dd>
        <dt className="font-medium">Created</dt>
        <dd>{n.createdAt.toISOString()}</dd>
        {n.errorMessage ? (
          <>
            <dt className="font-medium text-red-700">Error</dt>
            <dd className="text-red-700">{n.errorMessage}</dd>
          </>
        ) : null}
      </dl>

      <section>
        <h2 className="mb-1 text-sm font-medium">Body</h2>
        <pre className="whitespace-pre-wrap rounded border bg-gray-50 p-3 text-sm">
          {n.body}
        </pre>
      </section>

      <form action={retryNotificationAction}>
        <input type="hidden" name="id" value={n.id} />
        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          Retry (creates new row)
        </button>
      </form>
    </main>
  );
}
