import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { authPrisma } from "@/core/db/client";
import { authorizeCredentials } from "@/core/auth/credentials";

describe("login tenant", () => {
  it("requires the host tenant and rejects a mismatch", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: { id: `t-lg-${stamp}`, name: "Lg", slug: `lg-${stamp}` },
    });
    const other = await authPrisma.tenant.create({
      data: { id: `t-lg2-${stamp}`, name: "Lg2", slug: `lg2-${stamp}` },
    });
    const email = `lg-${stamp}@seed.local`;
    const password = "correct-horse-1";
    await authPrisma.user.create({
      data: {
        id: `u-lg-${stamp}`,
        tenantId: tenant.id,
        email,
        name: "Admin",
        role: "TENANT_ADMIN",
        passwordHash: await bcrypt.hash(password, 4),
      },
    });
    expect(await authorizeCredentials(email, password, null)).toBeNull();
    expect((await authorizeCredentials(email, password, tenant.id))?.id).toBe(`u-lg-${stamp}`);
    expect(await authorizeCredentials(email, password, other.id)).toBeNull();
  });
});
