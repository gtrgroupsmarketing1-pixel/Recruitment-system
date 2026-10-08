import { describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";
import { PERMISSIONS, can, type PermissionKey } from "@/core/auth/permissions";

const ALL_ROLES = Object.values(UserRole);

describe("PERMISSIONS matrix", () => {
  it("every key maps to a non-empty array of valid UserRole values", () => {
    const keys = Object.keys(PERMISSIONS) as PermissionKey[];
    expect(keys.length).toBeGreaterThan(10);
    for (const key of keys) {
      const roles = PERMISSIONS[key] as readonly UserRole[];
      expect(roles.length).toBeGreaterThan(0);
      for (const role of roles) {
        expect(ALL_ROLES).toContain(role);
      }
    }
  });

  it("requisition:delete allows only TENANT_ADMIN", () => {
    expect(PERMISSIONS["requisition:delete"]).toEqual(["TENANT_ADMIN"]);
    expect(can("TENANT_ADMIN", "requisition:delete")).toBe(true);
    expect(can("RECRUITER", "requisition:delete")).toBe(false);
    expect(can("FINANCE", "requisition:delete")).toBe(false);
  });

  it("candidate:view_sensitive does not allow FINANCE", () => {
    expect(can("FINANCE", "candidate:view_sensitive")).toBe(false);
    expect(can("COMPLIANCE_OFFICER", "candidate:view_sensitive")).toBe(true);
  });

  it("compliance:uncomplete_step allows only TENANT_ADMIN and COMPLIANCE_OFFICER", () => {
    expect(can("TENANT_ADMIN", "compliance:uncomplete_step")).toBe(true);
    expect(can("COMPLIANCE_OFFICER", "compliance:uncomplete_step")).toBe(true);
    expect(can("RECRUITER", "compliance:uncomplete_step")).toBe(false);
    expect(can("BRANCH_MANAGER", "compliance:uncomplete_step")).toBe(false);
  });

  it("FINANCE cannot mutate candidates or applications", () => {
    expect(can("FINANCE", "candidate:create")).toBe(false);
    expect(can("FINANCE", "candidate:update")).toBe(false);
    expect(can("FINANCE", "application:create")).toBe(false);
    expect(can("FINANCE", "application:change_status")).toBe(false);
    expect(can("FINANCE", "application:view")).toBe(true);
  });
});
