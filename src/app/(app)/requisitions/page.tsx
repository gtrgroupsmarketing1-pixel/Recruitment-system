import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { RequisitionFilters } from "@/modules/requisition/components/RequisitionFilters";
import { RequisitionList } from "@/modules/requisition/components/RequisitionList";
import { RequisitionService } from "@/modules/requisition/requisition.service";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

type ListProps = {
  searchParams: Promise<{ status?: string; client?: string; q?: string }>;
};

const STATUSES = ["OPEN", "IN_PROGRESS", "FILLED", "CANCELLED", "ON_HOLD"] as const;

export default async function RequisitionsPage({ searchParams }: ListProps) {
  const sp = await searchParams;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) {
    return <main className="p-8">Missing tenant</main>;
  }
  const status = STATUSES.find((s) => s === sp.status);
  const data = await withSessionScope((_scope) =>
    RequisitionService.list(tenantId, {
      status,
      clientCompanyId: sp.client,
      search: sp.q,
    })
  );
  return (
    <main className="space-y-6 p-6">
      <PageHeader
        title="Requisitions"
        description="Open roles, SLA, and fulfillment progress"
        actions={
          <Link
            href="/requisitions/new"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            New requisition
          </Link>
        }
      />
      <RequisitionFilters current={sp} />
      <RequisitionList data={data} />
    </main>
  );
}
