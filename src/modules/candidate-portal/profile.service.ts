import { authPrisma } from "@/core/db/client";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { CandidateScope } from "@/core/candidate-auth/scope";

export type CandidateSelfView = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  dateOfBirth: Date | null;
  passportNumber: string | null;
  nationalId: string | null;
  whatsappOptIn: boolean;
  smsOptIn: boolean;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
};

export const CandidateProfileService = {
  async getSelf(scope: CandidateScope): Promise<CandidateSelfView> {
    const row = await authPrisma.candidate.findFirst({
      where: { id: scope.candidateId, tenantId: scope.tenantId, deletedAt: null },
    });
    if (!row) throw new NotFoundError("Candidate", scope.candidateId);
    return {
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      nationality: row.nationality,
      dateOfBirth: null,
      passportNumber: row.passportNumber,
      nationalId: row.nationalId,
      whatsappOptIn: row.whatsappOptIn,
      smsOptIn: row.smsOptIn,
      emailVerifiedAt: row.emailVerifiedAt,
      phoneVerifiedAt: row.phoneVerifiedAt,
    };
  },

  async updateOptIns(scope: CandidateScope, input: { whatsappOptIn: boolean; smsOptIn: boolean }): Promise<void> {
    const row = await authPrisma.candidate.findFirst({
      where: { id: scope.candidateId, tenantId: scope.tenantId, deletedAt: null },
    });
    if (!row) throw new NotFoundError("Candidate", scope.candidateId);
    await authPrisma.candidate.updateMany({
      where: { id: scope.candidateId, tenantId: scope.tenantId },
      data: {
        whatsappOptIn: input.whatsappOptIn,
        smsOptIn: input.smsOptIn,
        smsOptInAt: input.smsOptIn ? new Date() : row.smsOptInAt,
      },
    });
    if (row.smsOptIn !== input.smsOptIn) {
      await authPrisma.auditLog.create({
        data: {
          tenantId: scope.tenantId,
          entity: "Candidate",
          entityId: scope.candidateId,
          field: "smsOptIn",
          oldValue: String(row.smsOptIn),
          newValue: String(input.smsOptIn),
        },
      });
    }
  },

  async updateContact(scope: CandidateScope, input: { email?: string; phone?: string }): Promise<void> {
    const data: { email?: string; phone?: string; emailVerifiedAt?: null; phoneVerifiedAt?: null } = {};
    if (input.email !== undefined) {
      data.email = input.email;
      data.emailVerifiedAt = null;
    }
    if (input.phone !== undefined) {
      data.phone = input.phone;
      data.phoneVerifiedAt = null;
    }
    if (Object.keys(data).length === 0) throw new ValidationError("Nothing to update");
    await authPrisma.candidate.updateMany({
      where: { id: scope.candidateId, tenantId: scope.tenantId },
      data,
    });
  },
};
