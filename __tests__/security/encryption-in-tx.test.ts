import { describe, it, expect } from "vitest";
import { authPrisma, withTenant, db } from "@/core/db/client";
import { decrypt } from "@/core/security/crypto";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("encryption inside withTenant", () => {
  it("stores ciphertext and decrypts to plaintext", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: {
        id: `t-enc-${stamp}`,
        name: "Enc Tenant",
        slug: `enc-${stamp}`,
      },
    });

    const created = await withTenant(tenant.id, () =>
      db.candidate.create({
        data: {
          tenantId: tenant.id,
          fullName: "Cipher Person",
          passportNumber: "AB123456",
        },
      })
    );
    expect(created.passportNumber).toBe("AB123456");

    const raw = await authPrisma.candidate.findFirst({
      where: { id: created.id },
    });
    expect(raw?.passportNumber).toBeTruthy();
    expect(raw?.passportNumber).not.toBe("AB123456");
    expect(raw?.passportNumberBidx).toBeTruthy();

    const plain = decrypt(raw!.passportNumber!);
    expect(plain).toBe("AB123456");
  });
});
