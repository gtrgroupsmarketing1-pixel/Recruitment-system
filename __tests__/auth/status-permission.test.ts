import { describe, expect, it } from "vitest";
import type { UserRole } from "@prisma/client";
import { ForbiddenError } from "@/lib/errors";
import { requireChangeStatusPermission } from "@/core/auth/status-permission";
import type { SessionScope } from "@/core/auth/scope";
import { STATUS, type Status } from "@/modules/application/application.state-machine";

function scope(role: UserRole): SessionScope {
  return {
    kind: "USER",
    tenantId: "t",
    userId: "u",
    role,
    branchId: null,
  };
}

function expectThrow(role: UserRole, from: Status, to: Status) {
  expect(() => requireChangeStatusPermission(scope(role), from, to)).toThrow(ForbiddenError);
}

function expectAllow(role: UserRole, from: Status, to: Status) {
  expect(() => requireChangeStatusPermission(scope(role), from, to)).not.toThrow();
}

describe("requireChangeStatusPermission", () => {
  it("allows staff roles from SOURCED to SCREENED", () => {
    expectAllow("TENANT_ADMIN", STATUS.SOURCED, STATUS.SCREENED);
    expectAllow("BRANCH_MANAGER", STATUS.SOURCED, STATUS.SCREENED);
    expectAllow("RECRUITER", STATUS.SOURCED, STATUS.SCREENED);
  });

  it("blocks mobilization officer before TRAVELED", () => {
    expectThrow("MOBILIZATION_OFFICER", STATUS.SOURCED, STATUS.SCREENED);
    expectThrow("MOBILIZATION_OFFICER", STATUS.MEDICAL_BOOKED, STATUS.MEDICAL_CLEARED);
  });

  it("allows mobilization officer from TRAVELED onward", () => {
    expectAllow("MOBILIZATION_OFFICER", STATUS.TRAVELED, STATUS.MOBILIZED);
    expectAllow("MOBILIZATION_OFFICER", STATUS.MOBILIZED, STATUS.PROBATION);
  });

  it("blocks compliance officer before MEDICAL_BOOKED", () => {
    expectThrow("COMPLIANCE_OFFICER", STATUS.SOURCED, STATUS.SCREENED);
    expectThrow("COMPLIANCE_OFFICER", STATUS.SELECTED, STATUS.MEDICAL_BOOKED);
  });

  it("allows compliance officer from MEDICAL_BOOKED onward", () => {
    expectAllow("COMPLIANCE_OFFICER", STATUS.MEDICAL_BOOKED, STATUS.MEDICAL_CLEARED);
    expectAllow("COMPLIANCE_OFFICER", STATUS.ATTESTATION_CLEARED, STATUS.VISA_APPLIED);
  });

  it("blocks FINANCE from any transition", () => {
    expectThrow("FINANCE", STATUS.SOURCED, STATUS.SCREENED);
    expectThrow("FINANCE", STATUS.TRAVELED, STATUS.MOBILIZED);
    expectThrow("FINANCE", STATUS.SOURCED, STATUS.REJECTED);
  });

  it("allows exit states for roles that can change status", () => {
    const roles: UserRole[] = [
      "TENANT_ADMIN",
      "BRANCH_MANAGER",
      "RECRUITER",
      "MOBILIZATION_OFFICER",
      "COMPLIANCE_OFFICER",
    ];
    for (const role of roles) {
      expectAllow(role, STATUS.SOURCED, STATUS.REJECTED);
      expectAllow(role, STATUS.SCREENED, STATUS.ON_HOLD);
      expectAllow(role, STATUS.SELECTED, STATUS.ABSCONDED);
    }
  });
});
