import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { resolveSender } from "@/modules/notification/sender.resolver";
import { NotificationService } from "@/modules/notification/notification.service";
import { EmailConfigClient } from "@/modules/notification/components/EmailConfigClient";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "cn";

type Props = {
  searchParams: Promise<{ saved?: string; tab?: string }>;
};

export default async function EmailConfigPage({ searchParams }: Props) {
  const sp = await searchParams;
  const tab = sp.tab === "log" ? "log" : "config";
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return <main className="p-8">Missing tenant</main>;

  const since = new Date(Date.now() - 30 * 86_400_000);
  const { sender, recent, stats } = await withSessionScope(async () => {
    const [s, list] = await Promise.all([
      resolveSender(tenantId),
      NotificationService.listForTenant(tenantId, { limit: 50 }),
    ]);
    const emailRows = list.filter((n) => n.channel === "EMAIL");
    const last30 = emailRows.filter((n) => n.createdAt >= since);
    const sent = last30.length;
    const failed = last30.filter(
      (n) => n.status === "FAILED" || n.status === "BOUNCED"
    ).length;
    const delivered = last30.filter(
      (n) => n.status === "DELIVERED" || n.status === "SENT"
    ).length;
    return {
      sender: s,
      recent: emailRows.slice(0, 20),
      stats: { sent, delivered, failed },
    };
  });

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Email sender"
        description="From identity, test delivery, and recent email log"
      />

      {sp.saved === "1" ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Settings saved.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/email-config"
          className={cn(
            "rounded-full border px-3 py-1 text-sm",
            tab === "config"
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-muted"
          )}
        >
          Configuration
        </Link>
        <Link
          href="/admin/email-config?tab=log"
          className={cn(
            "rounded-full border px-3 py-1 text-sm",
            tab === "log"
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-muted"
          )}
        >
          Delivery log
        </Link>
        <Link
          href="/admin/notifications"
          className="rounded-full border px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
        >
          Full notification log
        </Link>
      </div>

      {tab === "config" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Emails (30d)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">
                  {stats.sent}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Sent / delivered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">
                  {stats.delivered}
                </p>
              </CardContent>
            </Card>
            <Card
              className={
                stats.failed > 0
                  ? "border-red-200 bg-red-50/50 dark:border-red-900"
                  : undefined
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Failed / bounced
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={
                    stats.failed > 0
                      ? "text-2xl font-semibold tabular-nums text-destructive"
                      : "text-2xl font-semibold tabular-nums"
                  }
                >
                  {stats.failed}
                </p>
              </CardContent>
            </Card>
          </div>
          <EmailConfigClient sender={sender} />
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent email deliveries</CardTitle>
            <CardDescription>Last 20 email channel rows</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No email notifications yet. Send a test from Configuration.
              </p>
            ) : (
              <ul className="divide-y text-sm">
                {recent.map((n) => (
                  <li
                    key={n.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <div>
                      <p className="font-medium">
                        {n.subject ?? n.templateKey}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {n.recipientAddr} · {n.templateKey}
                      </p>
                    </div>
                    <span className="text-xs font-medium">{n.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
