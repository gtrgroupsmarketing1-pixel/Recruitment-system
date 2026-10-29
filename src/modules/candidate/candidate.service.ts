import type { Candidate, Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";
import { NotFoundError } from "@/lib/errors";
import { CandidateRepo } from "./candidate.repo";
import type { CreateCandidateInput, UpdateCandidateInput } from "./candidate.schema";
import { tryGetScope } from "@/core/auth/scope";
import { candidateScopeFilter, loadBranchUserIds } from "@/core/auth/scope-filter";

export type CandidateListItem = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  portalStatus: string;
  applicationCount: number;
  createdAt: Date;
};

export type CandidateDetailView = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  passportNumber: string | null;
  nationalId: string | null;
  medicalResult: string | null;
  createdAt: Date;
};

function toDetail(row: Candidate): CandidateDetailView {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    passportNumber: row.passportNumber,
    nationalId: row.nationalId,
    medicalResult: row.medicalResult,
    createdAt: row.createdAt,
  };
}

export const CandidateService = {
  async create(tenantId: string, userId: string, input: CreateCandidateInput) {
    void userId;
    const smsOptIn = input.smsOptIn === true;
    return CandidateRepo.create(tenantId, {
      tenantId,
      fullName: input.fullName.trim(),
      email: input.email,
      phone: input.phone,
      passportNumber: input.passportNumber,
      nationalId: input.nationalId,
      medicalResult: input.medicalResult,
      smsOptIn,
      smsOptInAt: smsOptIn ? new Date() : null,
    });
  },

  async list(
    tenantId: string,
    filter: { search?: string }
  ): Promise<CandidateListItem[]> {
    const scope = tryGetScope();
    let branchUserIds: string[] | undefined;
    if (scope?.kind === "USER" && scope.role === "BRANCH_MANAGER" && scope.branchId) {
      branchUserIds = await loadBranchUserIds(tenantId, scope.branchId);
    }
    const scopeWhere = scope ? candidateScopeFilter(scope, branchUserIds) : {};
    const rows = await CandidateRepo.list(tenantId, filter, scopeWhere);
    return rows.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      phone: r.phone,
      email: r.email,
      nationality: r.nationality,
      portalStatus: r.portalStatus,
      applicationCount: r._count.applications,
      createdAt: r.createdAt,
    }));
  },

  async getById(tenantId: string, id: string): Promise<CandidateDetailView> {
    logger.info({ candidateId: id, field: "detail_view" }, "candidate detail viewed");
    const row = await CandidateRepo.findById(tenantId, id);
    if (!row) throw new NotFoundError("Candidate", id);
    return toDetail(row);
  },

  async update(
    tenantId: string,
    userId: string,
    id: string,
    patch: UpdateCandidateInput
  ) {
    void userId;
    const existing = await CandidateRepo.findById(tenantId, id);
    if (!existing) throw new NotFoundError("Candidate", id);

    const data: Prisma.CandidateUncheckedUpdateInput = { ...patch };
    if (patch.smsOptIn === true && existing.smsOptIn === false) {
      data.smsOptInAt = new Date();
    }

    const updated = await CandidateRepo.update(tenantId, id, data);
    if (!updated) throw new NotFoundError("Candidate", id);
    return updated;
  },

  async softDelete(tenantId: string, userId: string, id: string) {
    void userId;
    const existing = await CandidateRepo.findById(tenantId, id);
    if (!existing) throw new NotFoundError("Candidate", id);
    const ok = await CandidateRepo.softDelete(tenantId, id);
    if (!ok) throw new NotFoundError("Candidate", id);
  },
};
