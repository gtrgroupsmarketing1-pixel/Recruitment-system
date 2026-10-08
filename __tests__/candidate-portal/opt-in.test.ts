import { describe, expect, it } from "vitest";
import { authPrisma } from "@/core/db/client";
import { seedTenantWithCase } from "../helpers/seed";
import { CandidateProfileService } from "@/modules/candidate-portal/profile.service";

describe("candidate opt-in", () => {
  it("toggles smsOptIn and writes an audit row", async () => {
    const seed = await seedTenantWithCase();
    const scope = { kind: "CANDIDATE" as const, tenantId: seed.tenantId, candidateId: seed.candidateId };
    await CandidateProfileService.updateOptIns(scope, { whatsappOptIn: true, smsOptIn: true });
    const row = await authPrisma.candidate.findFirst({ where: { id: seed.candidateId } });
    expect(row?.smsOptIn).toBe(true);
    const log = await authPrisma.auditLog.findFirst({
      where: { tenantId: seed.tenantId, entity: "Candidate", entityId: seed.candidateId, field: "smsOptIn" },
    });
    expect(log?.newValue).toBe("true");
  });
});
