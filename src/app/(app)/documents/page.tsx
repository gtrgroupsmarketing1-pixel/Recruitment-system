import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { DocumentService } from "@/modules/document/document.service";
import { ActionRequiredTable } from "@/modules/document/components/ActionRequiredTable";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { RealtimeRefresher } from "@/components/realtime/RealtimeRefresher";
import { cn } from "cn";

type Props = {
  searchParams: Promise<{ q?: string; type?: string }>;
};

export default async function DocumentsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) throw new Error("Missing tenant");

  const data = await withSessionScope(() =>
    DocumentService.getComplianceDashboard(tenantId, 30)
  );

  let rows = data.actionRequired;
  if (sp.q?.trim()) {
    const q = sp.q.trim().toLowerCase();
    rows = rows.filter(
      (d) =>
        d.candidate?.fullName?.toLowerCase().includes(q) ||
        d.label.toLowerCase().includes(q) ||
        d.fileName.toLowerCase().includes(q)
    );
  }
  if (sp.type) {
    rows = rows.filter((d) => d.type === sp.type);
  }

  return (
    <>
      <RealtimeRefresher eventTypes={["document.expiring"]} />
      <main className="space-y-6 p-6">
        <PageHeader
          title="Documents & compliance"
          description="Expirations, pending verification, and vault health"
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/candidates"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Choose candidate
              </Link>
              <Link
                href="/candidates"
                className={cn(buttonVariants({ variant: "default" }))}
              >
                Upload document
              </Link>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">
                Expiring / expired
              </CardTitle>
              <CardDescription>Within 30 days or past due</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums text-red-900 dark:text-red-100">
                {data.stats.expiredOrExpiring}
              </p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Pending verification
              </CardTitle>
              <CardDescription>Uploaded, not confirmed</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums text-amber-950 dark:text-amber-100">
                {data.stats.pendingVerification}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total valid</CardTitle>
              <CardDescription>
                Confirmed and not expiring soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">
                {data.stats.totalValid}
              </p>
            </CardContent>
          </Card>
        </div>

        <form
          method="get"
          className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center"
        >
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search candidate, label, file…"
            className="h-8 flex-1 rounded-lg border border-input bg-background px-2 text-sm sm:max-w-sm"
          />
          <select
            name="type"
            defaultValue={sp.type ?? ""}
            className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
          >
            <option value="">All types</option>
            <option value="PASSPORT">PASSPORT</option>
            <option value="VISA">VISA</option>
            <option value="NATIONAL_ID">NATIONAL_ID</option>
            <option value="MEDICAL_CERTIFICATE">MEDICAL_CERTIFICATE</option>
            <option value="ATTESTATION_PROOF">ATTESTATION_PROOF</option>
            <option value="CONTRACT">CONTRACT</option>
            <option value="OTHER">OTHER</option>
          </select>
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "default", size: "sm" }))}
          >
            Filter
          </button>
        </form>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Action required
          </h2>
          <ActionRequiredTable
            initialRows={rows.map((d) => ({
              id: d.id,
              type: d.type,
              label: d.label,
              fileName: d.fileName,
              expiryDate: d.expiryDate,
              confirmed: d.confirmed,
              candidateId: d.candidateId,
              candidate: d.candidate,
            }))}
          />
        </section>
      </main>
    </>
  );
}
