import { authPrisma } from "@/core/db/client";
import { NotFoundError } from "@/lib/errors";
import type { CandidateScope } from "@/core/candidate-auth/scope";
import type { ApplicationStatus } from "@prisma/client";

export type CandidateApplicationSelfView = {
  applicationId: string;
  roleCategory: string;
  destinationCountry: string;
  clientDisplayName: string;
  currentStatus: ApplicationStatus;
  currentStatusLabel: string;
  nextAction: string | null;
  blockers: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type TimelineEntry = {
  at: Date;
  label: string;
  detail: string | null;
};

const LABELS: Record<string, string> = {
  SOURCED: "Application submitted",
  SCREENED: "Screening complete",
  SHORTLISTED: "Shortlisted",
  MEDICAL_CLEARED: "Medical cleared",
  VISA_STAMPED: "Visa stamped",
  TRAVELED: "Traveled",
  MOBILIZED: "Mobilized",
};

export const CandidateStatusService = {
  async getApplications(scope: CandidateScope): Promise<CandidateApplicationSelfView[]> {
    const rows = await authPrisma.candidateApplication.findMany({
      where: { tenantId: scope.tenantId, candidateId: scope.candidateId, deletedAt: null },
      include: { requisition: true },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((row) => ({
      applicationId: row.id,
      roleCategory: row.requisition.roleCategory,
      destinationCountry: row.requisition.country,
      clientDisplayName: "A leading facilities company",
      currentStatus: row.status,
      currentStatusLabel: LABELS[row.status] ?? row.status,
      nextAction: row.status === "SOURCED" ? "Upload your passport" : null,
      blockers: row.status === "SOURCED" ? ["Passport photo"] : [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },

  async getTimeline(scope: CandidateScope, applicationId: string): Promise<TimelineEntry[]> {
    const app = await authPrisma.candidateApplication.findFirst({
      where: { id: applicationId, tenantId: scope.tenantId, candidateId: scope.candidateId, deletedAt: null },
    });
    if (!app) throw new NotFoundError("Application", applicationId);
    const logs = await authPrisma.auditLog.findMany({
      where: { tenantId: scope.tenantId, entity: "CandidateApplication", entityId: applicationId },
      orderBy: { createdAt: "asc" },
    });
    return logs.map((log) => ({
      at: log.createdAt,
      label: LABELS[log.newValue ?? ""] ?? "Status updated",
      detail: log.newValue,
    }));
  },
};
