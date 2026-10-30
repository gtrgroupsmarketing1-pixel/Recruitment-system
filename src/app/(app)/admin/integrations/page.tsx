import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { db } from "@/core/db/client";
import {
  disconnectDriveAction,
  retryFailedSyncsAction,
} from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export default async function IntegrationsPage() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return <main className="p-8">Missing tenant</main>;

  const [connections, calendarConnections, counts] = await withSessionScope(
    async (_scope) => {
      const rows = await db.tenantStorageConnection.findMany({
        where: { tenantId, deletedAt: null },
      });
      const cal = await db.userCalendarConnection.findMany({
        where: { tenantId, deletedAt: null, userId: session.user.id },
        select: {
          provider: true,
          externalEmail: true,
          lastError: true,
        },
      });
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [failed, synced, pending] = await Promise.all([
        db.documentSyncState.count({
          where: {
            tenantId,
            status: "FAILED",
            updatedAt: { gte: since },
          },
        }),
        db.documentSyncState.count({
          where: {
            tenantId,
            status: "SYNCED",
            updatedAt: { gte: since },
          },
        }),
        db.documentSyncState.count({
          where: {
            tenantId,
            status: { in: ["PENDING", "SYNCING"] },
            updatedAt: { gte: since },
          },
        }),
      ]);
      return [rows, cal, { failed, synced, pending }] as const;
    }
  );

  const google = connections.find((c) => c.provider === "GOOGLE_DRIVE");
  const ms = connections.find((c) => c.provider === "ONEDRIVE");
  const gCal = calendarConnections.find((c) => c.provider === "GOOGLE");
  const mCal = calendarConnections.find((c) => c.provider === "MICROSOFT");

  const cards = [
    {
      id: "GOOGLE_DRIVE",
      name: "Google Drive",
      type: "Storage",
      desc: "Auto-save candidate documents and CVs to a shared Drive folder.",
      connected: Boolean(google),
      account: google?.externalEmail,
      connectHref: "/api/oauth/google",
      disconnectProvider: "GOOGLE_DRIVE" as const,
      accent: "text-emerald-600",
    },
    {
      id: "ONEDRIVE",
      name: "Microsoft OneDrive",
      type: "Storage",
      desc: "Auto-save candidate documents to OneDrive / SharePoint.",
      connected: Boolean(ms),
      account: ms?.externalEmail,
      connectHref: "/api/oauth/microsoft",
      disconnectProvider: "ONEDRIVE" as const,
      accent: "text-sky-600",
    },
    {
      id: "GOOGLE_CALENDAR",
      name: "Google Calendar",
      type: "Calendar",
      desc: "Sync interviews and medical appointments to your calendar.",
      connected: Boolean(gCal),
      account: gCal?.externalEmail,
      connectHref: "/settings/calendar",
      manageOnly: true,
      accent: "text-blue-600",
    },
    {
      id: "OUTLOOK_CALENDAR",
      name: "Outlook Calendar",
      type: "Calendar",
      desc: "Sync interviews to Microsoft 365 / Outlook calendar.",
      connected: Boolean(mCal),
      account: mCal?.externalEmail,
      connectHref: "/settings/calendar",
      manageOnly: true,
      accent: "text-indigo-600",
    },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeader
        title="Integrations"
        description="Cloud storage and calendars for document sync and interviews"
      />

      <Card
        className={
          counts.failed > 0
            ? "border-red-200 bg-red-50/40 dark:border-red-900"
            : "bg-muted/30"
        }
      >
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">Sync health (24h)</span>
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-800"
            >
              Synced {counts.synced}
            </Badge>
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-amber-900"
            >
              Pending {counts.pending}
            </Badge>
            <Badge
              variant={counts.failed > 0 ? "destructive" : "outline"}
              className={
                counts.failed === 0
                  ? "border-muted-foreground/20 text-muted-foreground"
                  : undefined
              }
            >
              Failed {counts.failed}
            </Badge>
          </div>
          <form action={retryFailedSyncsAction}>
            <Button
              type="submit"
              size="sm"
              variant={counts.failed > 0 ? "destructive" : "outline"}
              disabled={counts.failed === 0}
            >
              Retry failed
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((p) => (
          <Card
            key={p.id}
            className={p.connected ? "border-primary/40 shadow-sm" : undefined}
          >
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">{p.name}</CardTitle>
                <CardDescription>{p.type}</CardDescription>
              </div>
              {p.connected ? (
                <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">Not connected</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{p.desc}</p>
              {p.connected && p.account ? (
                <p className="rounded-md border bg-muted/40 px-2 py-1 font-mono text-xs">
                  {p.account}
                </p>
              ) : null}
            </CardContent>
            <CardFooter className="border-t pt-4">
              {p.connected ? (
                <div className="flex w-full flex-wrap gap-2">
                  {p.manageOnly ? (
                    <Link
                      href={p.connectHref}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "flex-1"
                      )}
                    >
                      Manage
                    </Link>
                  ) : (
                    <form action={disconnectDriveAction} className="flex-1">
                      <input
                        type="hidden"
                        name="provider"
                        value={p.disconnectProvider}
                      />
                      <Button
                        type="submit"
                        variant="ghost"
                        className="w-full text-destructive hover:text-destructive"
                      >
                        Disconnect
                      </Button>
                    </form>
                  )}
                </div>
              ) : (
                <Link
                  href={p.connectHref}
                  className={cn(buttonVariants({ variant: "default" }), "w-full")}
                >
                  Connect {p.name}
                </Link>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Disconnecting storage stops new document syncs; files already in Drive
        are not deleted. Calendar connections are per user at{" "}
        <Link href="/settings/calendar" className="underline">
          Calendar settings
        </Link>
        .
      </p>
    </main>
  );
}
