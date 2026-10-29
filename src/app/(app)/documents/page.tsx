import Link from "next/link";
import { differenceInDays, format } from "date-fns";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { DocumentService } from "@/modules/document/document.service";
import { confirmDocumentAction } from "@/modules/document/confirm.action";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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

  const now = new Date();

  return (
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
            <CardDescription>Confirmed and not expiring soon</CardDescription>
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
        <h2 className="text-lg font-semibold tracking-tight">Action required</h2>
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Label / file</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    All documents are valid and verified. Great job!
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((doc) => {
                  const daysLeft =
                    doc.expiryDate != null
                      ? differenceInDays(doc.expiryDate, now)
                      : null;
                  const expired = daysLeft != null && daysLeft < 0;
                  const expiring =
                    daysLeft != null && daysLeft >= 0 && daysLeft <= 30;

                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {doc.candidate ? (
                          <Link
                            href={`/candidates/${doc.candidate.id}`}
                            className="text-primary hover:underline"
                          >
                            {doc.candidate.fullName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[14rem]">
                        <p className="truncate text-sm">{doc.label}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {doc.fileName}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {doc.expiryDate
                          ? format(doc.expiryDate, "MMM d, yyyy")
                          : "—"}
                        {expired ? (
                          <span className="ml-2 text-xs font-semibold text-destructive">
                            Expired
                          </span>
                        ) : expiring ? (
                          <span className="ml-2 text-xs font-semibold text-amber-600">
                            {daysLeft}d left
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {!doc.confirmed ? (
                          <Badge variant="secondary">Needs verification</Badge>
                        ) : expired ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : expiring ? (
                          <Badge variant="outline">Expiring soon</Badge>
                        ) : (
                          <Badge variant="outline">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {doc.candidateId ? (
                            <Link
                              href={`/candidates/${doc.candidateId}/documents`}
                              className={cn(
                                buttonVariants({ variant: "outline", size: "sm" })
                              )}
                            >
                              View
                            </Link>
                          ) : null}
                          {!doc.confirmed ? (
                            <form action={confirmDocumentAction}>
                              <input
                                type="hidden"
                                name="documentId"
                                value={doc.id}
                              />
                              <button
                                type="submit"
                                className={cn(
                                  buttonVariants({ size: "sm" })
                                )}
                              >
                                Verify
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}
