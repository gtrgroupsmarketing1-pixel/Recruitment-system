import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { authPrisma } from "@/core/db/client";
import { authorizeCredentials } from "@/core/auth/credentials";

describe("deleted user login", () => {
  it("rejects a user with deletedAt set and accepts an active user", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: { id: `t-del-${stamp}`, name: "Del", slug: `del-${stamp}` },
    });
    const company = await authPrisma.clientCompany.create({
      data: { id: `cl-del-${stamp}`, tenantId: tenant.id, name: "C", code: `D${stamp % 100000}` },
    });
    const password = "correct-horse-1";
    const passwordHash = await bcrypt.hash(password, 4);
    const email = `gone-${stamp}@seed.local`;
    await authPrisma.user.create({
      data: {
        id: `u-del-${stamp}`,
        tenantId: tenant.id,
        email,
        name: "Gone",
        role: "CLIENT_USER",
        clientCompanyId: company.id,
        passwordHash,
        deletedAt: new Date(),
      },
    });
    await expect(authorizeCredentials(email, password)).resolves.toBeNull();

    const liveEmail = `live-${stamp}@seed.local`;
    await authPrisma.user.create({
      data: {
        id: `u-live-${stamp}`,
        tenantId: tenant.id,
        email: liveEmail,
        name: "Live",
        role: "CLIENT_USER",
        clientCompanyId: company.id,
        passwordHash,
      },
    });
    const live = await authorizeCredentials(liveEmail, password);
    expect(live?.id).toBe(`u-live-${stamp}`);
  });
});
