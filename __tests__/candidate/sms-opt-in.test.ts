import { describe, it, expect } from "vitest";
import { withTenant } from "@/core/db/client";
import { seedTenantWithCase } from "../helpers/seed";
import { CandidateService } from "@/modules/candidate/candidate.service";
import { CandidateRepo } from "@/modules/candidate/candidate.repo";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("candidate SMS opt-in", () => {
  it("sets smsOptInAt when opting in", async () => {
    const seed = await seedTenantWithCase();
    const before = await withTenant(seed.tenantId, () =>
      CandidateRepo.findById(seed.tenantId, seed.candidateId)
    );
    expect(before?.smsOptIn).toBe(false);

    const updated = await withTenant(seed.tenantId, () =>
      CandidateService.update(seed.tenantId, seed.adminId, seed.candidateId, {
        smsOptIn: true,
      })
    );
    expect(updated.smsOptIn).toBe(true);
    expect(updated.smsOptInAt).toBeTruthy();
  });

  it("preserves smsOptInAt when opting out", async () => {
    const seed = await seedTenantWithCase();
    const opted = await withTenant(seed.tenantId, () =>
      CandidateService.update(seed.tenantId, seed.adminId, seed.candidateId, {
        smsOptIn: true,
      })
    );
    const at = opted.smsOptInAt;
    expect(at).toBeTruthy();

    const out = await withTenant(seed.tenantId, () =>
      CandidateService.update(seed.tenantId, seed.adminId, seed.candidateId, {
        smsOptIn: false,
      })
    );
    expect(out.smsOptIn).toBe(false);
    expect(out.smsOptInAt?.getTime()).toBe(at!.getTime());
  });
});
