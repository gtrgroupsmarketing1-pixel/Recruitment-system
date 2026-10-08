import { describe, expect, it } from "vitest";
import {
  clientApplicationFilter,
  clientRequisitionFilter,
} from "@/core/auth/scope-filter";
import type { SessionScope } from "@/core/auth/scope";

function client(company: string | null): SessionScope {
  return {
    kind: "USER",
    tenantId: "t",
    userId: "u",
    role: "CLIENT_USER",
    branchId: null,
    clientCompanyId: company,
  };
}

describe("client scope filters", () => {
  it("scopes requisitions to the client company", () => {
    expect(clientRequisitionFilter(client("A"))).toEqual({ clientCompanyId: "A" });
  });

  it("fails closed when clientCompanyId is missing", () => {
    expect(clientRequisitionFilter(client(null))).toEqual({ id: "__never__" });
    expect(clientApplicationFilter(client(null))).toEqual({ id: "__never__" });
  });

  it("does not filter staff roles", () => {
    const staff: SessionScope = {
      kind: "USER",
      tenantId: "t",
      userId: "u",
      role: "RECRUITER",
      branchId: null,
      clientCompanyId: null,
    };
    expect(clientRequisitionFilter(staff)).toEqual({});
  });
});
