import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ComplianceDashboardService } from "@/modules/compliance/compliance.dashboard.service";
import { toCsv } from "@/modules/compliance/compliance.dashboard.csv";

export async function GET(): Promise<Response> {
  const csv = await withSessionScope(async (scope) => {
    requirePermission("compliance:view_dashboard");
    const cases = await ComplianceDashboardService.listAtRiskCases(
      scope.tenantId,
      { limit: 1000 }
    );
    return toCsv(
      cases.map((row) => ({
        candidateName: row.candidateName,
        requisitionCode: row.requisitionCode,
        riskLevel: row.risk.level,
        score: row.risk.score,
        blockingStepName: row.risk.blockingStepName,
        daysUntilTarget: row.risk.daysUntilTarget,
      }))
    );
  });
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="at-risk-cases-${Date.now()}.csv"`,
    },
  });
}
