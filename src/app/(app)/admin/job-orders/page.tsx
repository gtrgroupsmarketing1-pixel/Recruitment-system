import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { JobOrderService } from "@/modules/client/joborder.service";
import {
  JobOrderInbox,
  type JobOrderRow,
} from "@/modules/client/components/JobOrderInbox";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminJobOrdersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const tabRaw = (sp.tab ?? "PENDING").toUpperCase();
  const tab =
    tabRaw === "CONVERTED" || tabRaw === "REJECTED" || tabRaw === "PENDING"
      ? tabRaw
      : "PENDING";

  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId!;
  const rows = await withSessionScope(async () => {
    requirePermission("joborder:review");
    return JobOrderService.listForStaff(tenantId);
  });

  const mapped: JobOrderRow[] = rows.map((r) => ({
    id: r.id,
    roleTitle: r.roleTitle,
    roleCategory: r.roleCategory,
    country: r.country,
    vacancyCount: r.vacancyCount,
    status: r.status,
    description: r.description,
    createdAt: r.createdAt.toISOString(),
    requisitionId: r.requisitionId,
    clientName: r.clientCompany?.name ?? "Client",
    clientCode: r.clientCompany?.code ?? "—",
  }));

  const pending = mapped.filter((r) => r.status === "PENDING");
  const converted = mapped.filter((r) => r.status === "CONVERTED");
  const rejected = mapped.filter((r) => r.status === "REJECTED");
  const active =
    tab === "CONVERTED"
      ? converted
      : tab === "REJECTED"
        ? rejected
        : pending;

  return (
    <main className="space-y-6 p-6">
      <PageHeader
        title="Job orders"
        description="Client portal intake — convert to a requisition in one click"
        actions={
          <Link
            href="/admin/clients"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Manage clients
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["PENDING", pending.length, "Pending review"],
            ["CONVERTED", converted.length, "Converted"],
            ["REJECTED", rejected.length, "Rejected"],
          ] as const
        ).map(([key, count, label]) => (
          <Link
            key={key}
            href={`/admin/job-orders?tab=${key}`}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              tab === key
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            {label} ({count})
          </Link>
        ))}
      </div>

      <JobOrderInbox orders={active} tab={tab} />
    </main>
  );
}
