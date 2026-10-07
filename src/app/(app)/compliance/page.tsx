import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { ValidationError } from "@/lib/errors";
import { ComplianceDashboardService } from "@/modules/compliance/compliance.dashboard.service";
import { AtRiskTable } from "@/modules/compliance/components/dashboard/AtRiskTable";
import { BottleneckHeatmap } from "@/modules/compliance/components/dashboard/BottleneckHeatmap";

export default async function ComplianceDashboardPage() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) throw new ValidationError("Missing session tenant");
  const [riskCases, bottlenecks, expiring] = await withTenant(tenantId, () =>
    Promise.all([
      ComplianceDashboardService.listAtRiskCases(tenantId, { limit: 50 }),
      ComplianceDashboardService.listBottlenecks(tenantId),
      ComplianceDashboardService.listExpiringDocuments(tenantId),
    ])
  );
  const counts = {
    CRITICAL: riskCases.filter((row) => row.risk.level === "CRITICAL").length,
    HIGH: riskCases.filter((row) => row.risk.level === "HIGH").length,
    MEDIUM: riskCases.filter((row) => row.risk.level === "MEDIUM").length,
  };
  return (
    <main className="mx-auto max-w-5xl p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Compliance Dashboard</h1>
        <a className="rounded border px-3 py-1 text-sm" href="/compliance/export">Export CSV</a>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
        <div className="rounded border p-3">CRITICAL {counts.CRITICAL}</div>
        <div className="rounded border p-3">HIGH {counts.HIGH}</div>
        <div className="rounded border p-3">MEDIUM {counts.MEDIUM}</div>
        <div className="rounded border p-3">EXPIRING {expiring.expired.length + expiring.within7.length + expiring.within15.length + expiring.within30.length}</div>
      </div>
      <section className="mt-6">
        <h2 className="text-sm font-medium">At-risk cases</h2>
        <AtRiskTable cases={riskCases} />
      </section>
      <section className="mt-6">
        <h2 className="text-sm font-medium">Bottleneck heatmap</h2>
        <BottleneckHeatmap entries={bottlenecks} />
      </section>
      <section className="mt-6 text-sm">
        <h2 className="font-medium">Expiring documents</h2>
        <p>Expired {expiring.expired.length} · 7 days {expiring.within7.length} · 15 days {expiring.within15.length} · 30 days {expiring.within30.length}</p>
        <Link href="/documents">Open vault</Link>
      </section>
    </main>
  );
}
