import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { ValidationError } from "@/lib/errors";
import { ComplianceDashboardService } from "@/modules/compliance/compliance.dashboard.service";
import { toCsv } from "@/modules/compliance/compliance.dashboard.csv";

export async function GET(): Promise<Response> {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) throw new ValidationError("Missing session tenant");
  const cases = await withTenant(tenantId, () =>
    ComplianceDashboardService.listAtRiskCases(tenantId, { limit: 1000 })
  );
  const csv = toCsv(
    cases.map((row) => ({
      candidateName: row.candidateName,
      requisitionCode: row.requisitionCode,
      riskLevel: row.risk.level,
      score: row.risk.score,
      blockingStepName: row.risk.blockingStepName,
      daysUntilTarget: row.risk.daysUntilTarget,
    }))
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="at-risk-cases-${Date.now()}.csv"`,
    },
  });
}
