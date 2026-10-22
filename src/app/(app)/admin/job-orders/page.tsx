import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { JobOrderService } from "@/modules/client/joborder.service";
import { reviewJobOrderAction } from "./review.action";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AdminJobOrdersPage() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId!;
  const rows = await withSessionScope(async () => {
    requirePermission("joborder:review");
    return JobOrderService.listForStaff(tenantId);
  });

  const companyIds = [...new Set(rows.map((r) => r.clientCompanyId))];
  const companies = companyIds.length
    ? await db.clientCompany.findMany({
        where: { tenantId, id: { in: companyIds }, deletedAt: null },
        select: { id: true, name: true, code: true },
      })
    : [];
  const companyMap = new Map(companies.map((c) => [c.id, c]));

  return (
    <main className="mx-auto grid max-w-3xl gap-4 p-6">
      <PageHeader
        title="Job orders"
        description="Requests submitted by client portal users. Accept to acknowledge; create a requisition separately if needed."
        actions={
          <Link href="/admin/clients" className="text-sm underline underline-offset-2">
            Clients
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No job orders yet"
          description="When a client user submits a job order from the client portal, it appears here for review."
          action={
            <Link
              href="/admin/clients"
              className="rounded bg-neutral-900 px-3 py-2 text-sm text-white"
            >
              Manage clients
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {rows.map((r) => {
            const company = companyMap.get(r.clientCompanyId);
            return (
              <li key={r.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{r.roleTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {company
                        ? `${company.name} (${company.code})`
                        : r.clientCompanyId}{" "}
                      · {r.country} · {r.roleCategory} · {r.vacancyCount} seats
                    </p>
                    {r.description ? (
                      <p className="mt-1 text-sm">{r.description}</p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium">
                    {r.status}
                  </span>
                </div>
                {r.status === "PENDING" ? (
                  <form action={reviewJobOrderAction} className="mt-3 flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <input
                      name="notes"
                      placeholder="Review notes"
                      className="min-w-[12rem] flex-1 rounded border px-2 py-1 text-sm"
                    />
                    <button
                      name="action"
                      value="ACCEPT"
                      className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white"
                    >
                      Accept
                    </button>
                    <button
                      name="action"
                      value="REJECT"
                      className="rounded border px-3 py-1.5 text-sm"
                    >
                      Reject
                    </button>
                  </form>
                ) : r.reviewNotes ? (
                  <p className="mt-2 text-xs text-muted-foreground">Notes: {r.reviewNotes}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
