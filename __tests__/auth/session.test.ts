import { describe, it, expect } from "vitest";
import { withTenantClaims, toSession } from "@/core/auth/auth.config";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";

describe("session claims", () => {
  it("round-trips tenantId through withTenantClaims and toSession", () => {
    const user = {
      id: "user_1",
      email: "a@agency.test",
      name: "Ada",
      tenantId: "ten_1",
      role: "TENANT_ADMIN",
    } as User;
    const token = withTenantClaims({} as JWT, user);
    expect(token.tenantId).toBe("ten_1");
    expect(token.role).toBe("TENANT_ADMIN");

    const refreshed = withTenantClaims(token, null);
    expect(refreshed.tenantId).toBe("ten_1");

    const partial = withTenantClaims(refreshed, {
      id: "user_1",
      email: "a@agency.test",
      name: "Ada",
    } as User);
    expect(partial.tenantId).toBe("ten_1");
    expect(partial.role).toBe("TENANT_ADMIN");

    const session = toSession(
      { user: { name: "Ada", email: "a@agency.test" }, expires: "2099-01-01" } as Session,
      refreshed
    );
    expect(session.tenantId).toBe("ten_1");
    expect(session.user.id).toBe("user_1");
  });
});
