import type { Candidate } from "@prisma/client";
import { logger } from "@/lib/logger";
import { NotFoundError } from "@/lib/errors";
import { CandidateRepo } from "./candidate.repo";
import type { CreateCandidateInput, UpdateCandidateInput } from "./candidate.schema";

export type CandidateListItem = {
  id: string;
  fullName: string;
  phone: string | null;
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
    return CandidateRepo.create(tenantId, {
      tenantId,
      fullName: input.fullName.trim(),
      email: input.email,
      phone: input.phone,
      passportNumber: input.passportNumber,
      nationalId: input.nationalId,
      medicalResult: input.medicalResult,
    });
  },

  async list(
    tenantId: string,
    filter: { search?: string }
  ): Promise<CandidateListItem[]> {
    return CandidateRepo.list(tenantId, filter);
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
    const updated = await CandidateRepo.update(tenantId, id, patch);
    if (!updated) throw new NotFoundError("Candidate", id);
    return updated;
  },
};
