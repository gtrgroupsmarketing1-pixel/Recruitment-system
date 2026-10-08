import { describe, expect, it } from "vitest";
import { assertUserScope } from "@/modules/user/user.scope.guard";
import { ValidationError } from "@/lib/errors";

describe("assertUserScope", () => {
  it("accepts CLIENT_USER with company and no branch", () => {
    expect(() =>
      assertUserScope({ role: "CLIENT_USER", branchId: null, clientCompanyId: "c1" })
    ).not.toThrow();
  });

  it("rejects CLIENT_USER without company", () => {
    expect(() =>
      assertUserScope({ role: "CLIENT_USER", branchId: null, clientCompanyId: null })
    ).toThrow(ValidationError);
  });

  it("rejects CLIENT_USER with a branch", () => {
    expect(() =>
      assertUserScope({ role: "CLIENT_USER", branchId: "b1", clientCompanyId: "c1" })
    ).toThrow(ValidationError);
  });

  it("rejects staff with a client company", () => {
    expect(() =>
      assertUserScope({ role: "TENANT_ADMIN", branchId: null, clientCompanyId: "c1" })
    ).toThrow(ValidationError);
  });

  it("accepts staff without a client company", () => {
    expect(() =>
      assertUserScope({ role: "RECRUITER", branchId: null, clientCompanyId: null })
    ).not.toThrow();
    expect(() =>
      assertUserScope({ role: "BRANCH_MANAGER", branchId: "b1", clientCompanyId: null })
    ).not.toThrow();
  });
});
