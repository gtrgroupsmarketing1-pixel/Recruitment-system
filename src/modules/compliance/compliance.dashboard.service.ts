import { db } from "@/core/db/client";
import { assessRisk, type RiskLevel, type RiskAssessment } from "./compliance.risk";
import { expiryBucket } from "./compliance.expiring";

export type RiskCaseView = {
  caseId: string;
  applicationId: string;
  candidateName: string;
  candidateId: string;
  requisitionCode: string;
  clientName: string;
  originCountry: string;
  destinationCountry: string;
  caseCreatedAt: Date;
  targetOnboardingDate: Date | null;
  risk: RiskAssessment;
  completedSteps: number;
  totalSteps: number;
};

export type BottleneckEntry = {
  stepName: string;
  stepOrder: number;
  averageDaysStuck: number;
  casesStuck: number;
  totalCases: number;
  pctStuck: number;
};

const rank: Record<RiskLevel, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export const ComplianceDashboardService = {
  async listAtRiskCases(
    tenantId: string,
    filter: { minLevel?: RiskLevel; limit?: number }
  ): Promise<RiskCaseView[]> {
    const cases = await db.complianceCase.findMany({
      where: { tenantId, deletedAt: null, status: { notIn: ["COMPLETE", "CANCELLED"] } },
      include: { checklists: true, template: true },
    });
    const candidateIds = [...new Set(cases.map((row) => row.candidateId))];
    const requisitionIds = [...new Set(cases.map((row) => row.requisitionId))];
    const candidates = await db.candidate.findMany({
      where: { tenantId, id: { in: candidateIds }, deletedAt: null },
    });
    const requisitions = await db.jobRequisition.findMany({
      where: { tenantId, id: { in: requisitionIds }, deletedAt: null },
    });
    const clientIds = [...new Set(requisitions.map((row) => row.clientCompanyId))];
    const clients = await db.clientCompany.findMany({
      where: { tenantId, id: { in: clientIds }, deletedAt: null },
    });
    const candidateById = new Map(candidates.map((row) => [row.id, row]));
    const requisitionById = new Map(requisitions.map((row) => [row.id, row]));
    const clientById = new Map(clients.map((row) => [row.id, row]));
    const views = cases.map((row) => {
      const requisition = requisitionById.get(row.requisitionId);
      const risk = assessRisk({
        caseCreatedAt: row.createdAt,
        targetOnboardingDate: requisition?.targetOnboardingDate ?? null,
        checklists: row.checklists.map((step) => ({
          stepOrder: step.stepOrder,
          name: step.name,
          status: step.status,
          dueDate: step.dueDate,
        })),
      });
      return {
        caseId: row.id,
        applicationId: row.applicationId,
        candidateName: candidateById.get(row.candidateId)?.fullName ?? "Unknown",
        candidateId: row.candidateId,
        requisitionCode: requisition?.reqCode ?? "",
        clientName: requisition ? clientById.get(requisition.clientCompanyId)?.name ?? "" : "",
        originCountry: row.template.originCountry,
        destinationCountry: row.template.destinationCountry,
        caseCreatedAt: row.createdAt,
        targetOnboardingDate: requisition?.targetOnboardingDate ?? null,
        risk,
        completedSteps: row.checklists.filter((step) => step.status === "COMPLETE").length,
        totalSteps: row.checklists.length,
      };
    });
    const min = filter.minLevel ? rank[filter.minLevel] : 3;
    return views
      .filter((row) => rank[row.risk.level] <= min)
      .sort((a, b) => {
        const level = rank[a.risk.level] - rank[b.risk.level];
        if (level !== 0) return level;
        const aDays = a.risk.daysUntilTarget ?? 9999;
        const bDays = b.risk.daysUntilTarget ?? 9999;
        return aDays - bDays;
      })
      .slice(0, filter.limit ?? 50);
  },

  async listBottlenecks(tenantId: string): Promise<BottleneckEntry[]> {
    const rows = await db.$queryRaw<
      Array<{ name: string; stepOrder: number; total_cases: bigint; cases_stuck: bigint; avg_days_stuck: number | null }>
    >`
      SELECT
        ci."name" AS name,
        ci."stepOrder" AS "stepOrder",
        COUNT(*)::bigint AS total_cases,
        COUNT(*) FILTER (WHERE ci."status" = 'PENDING')::bigint AS cases_stuck,
        AVG(EXTRACT(EPOCH FROM (NOW() - ci."updatedAt")) / 86400) AS avg_days_stuck
      FROM "ChecklistInstance" ci
      JOIN "ComplianceCase" cc ON cc.id = ci."caseId"
      WHERE ci."tenantId" = ${tenantId}
        AND cc."status" NOT IN ('COMPLETE', 'CANCELLED')
        AND ci."deletedAt" IS NULL
      GROUP BY ci."name", ci."stepOrder"
      ORDER BY ci."stepOrder"
    `;
    return rows.map((row) => {
      const total = Number(row.total_cases);
      const stuck = Number(row.cases_stuck);
      return {
        stepName: row.name,
        stepOrder: Number(row.stepOrder),
        averageDaysStuck: Number(row.avg_days_stuck ?? 0),
        casesStuck: stuck,
        totalCases: total,
        pctStuck: total === 0 ? 0 : (stuck / total) * 100,
      };
    });
  },

  async listExpiringDocuments(tenantId: string, today = new Date()) {
    const until = new Date(today.getTime() + 30 * 86_400_000);
    const docs = await db.document.findMany({
      where: {
        tenantId,
        deletedAt: null,
        confirmed: true,
        expiryDate: { lte: until },
      },
      orderBy: { expiryDate: "asc" },
    });
    return {
      expired: docs.filter((row) => row.expiryDate && expiryBucket(row.expiryDate, today) === "expired"),
      within7: docs.filter((row) => row.expiryDate && expiryBucket(row.expiryDate, today) === "within7"),
      within15: docs.filter((row) => row.expiryDate && expiryBucket(row.expiryDate, today) === "within15"),
      within30: docs.filter((row) => row.expiryDate && expiryBucket(row.expiryDate, today) === "within30"),
    };
  },
};
