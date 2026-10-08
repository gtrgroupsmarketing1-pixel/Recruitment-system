import { describe, expect, it } from "vitest";
import { can } from "@/core/auth/permissions";

describe("CLIENT_USER permissions", () => {
  it("has client portal keys and not staff mutation keys", () => {
    expect(can("CLIENT_USER", "joborder:submit")).toBe(true);
    expect(can("CLIENT_USER", "client:view_requisitions")).toBe(true);
    expect(can("CLIENT_USER", "client:view_candidates")).toBe(true);
    expect(can("CLIENT_USER", "client:comment_candidate")).toBe(true);
    expect(can("CLIENT_USER", "client:view_documents")).toBe(true);
    expect(can("CLIENT_USER", "client:view_deployments")).toBe(true);
    expect(can("CLIENT_USER", "requisition:create")).toBe(false);
    expect(can("CLIENT_USER", "application:change_status")).toBe(false);
    expect(can("CLIENT_USER", "compliance:complete_step")).toBe(false);
    expect(can("CLIENT_USER", "candidate:create")).toBe(false);
    expect(can("CLIENT_USER", "task:view_all")).toBe(false);
    expect(can("CLIENT_USER", "admin:jobs")).toBe(false);
  });

  it("staff roles do not have client portal keys", () => {
    for (const role of ["TENANT_ADMIN", "BRANCH_MANAGER", "RECRUITER", "FINANCE"] as const) {
      expect(can(role, "client:view_requisitions")).toBe(false);
      expect(can(role, "client:comment_candidate")).toBe(false);
      expect(can(role, "joborder:submit")).toBe(false);
    }
  });
});
