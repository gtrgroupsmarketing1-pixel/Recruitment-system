import { describe, expect, it } from "vitest";
import { CandidateAuthService } from "@/modules/candidate-portal/auth.service";
import { authPrisma } from "@/core/db/client";

describe("enumeration resistance", () => {
  it("candidate auth request returns ok for existing and missing identifiers", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: { name: `Enum ${stamp}`, slug: `enum-${stamp}` },
    });
    const candidate = await authPrisma.candidate.create({
      data: {
        tenantId: tenant.id,
        fullName: "Enum Candidate",
        email: `enum-${stamp}@seed.local`,
        phone: `+9715${String(stamp).slice(-8)}`,
      },
    });

    const existing = await CandidateAuthService.request({
      tenantId: tenant.id,
      identifier: candidate.email!,
      ipAddress: "1.2.3.4",
      userAgent: null,
    });
    const missing = await CandidateAuthService.request({
      tenantId: tenant.id,
      identifier: `missing-${stamp}@seed.local`,
      ipAddress: "1.2.3.4",
      userAgent: null,
    });
    expect(existing).toEqual({ ok: true });
    expect(missing).toEqual({ ok: true });
  });
});
