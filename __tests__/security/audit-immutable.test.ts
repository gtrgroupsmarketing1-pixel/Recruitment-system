import { describe, expect, it } from "vitest";
import { authPrisma } from "@/core/db/client";

describe("audit log immutability", () => {
  it("blocks UPDATE and DELETE via rules (row survives)", async () => {
    const tenant = await authPrisma.tenant.create({
      data: {
        name: `Audit Imm ${Date.now()}`,
        slug: `audit-imm-${Date.now()}`,
      },
    });
    const row = await authPrisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        entity: "Test",
        entityId: "e1",
        field: "status",
        oldValue: "A",
        newValue: "B",
      },
    });

    // Rules DO INSTEAD NOTHING — Prisma may report success with 0 effect
    await authPrisma.auditLog.updateMany({
      where: { id: row.id },
      data: { newValue: "TAMPERED" },
    });
    await authPrisma.auditLog.deleteMany({ where: { id: row.id } });

    const after = await authPrisma.auditLog.findFirst({ where: { id: row.id } });
    expect(after).toBeTruthy();
    expect(after?.newValue).toBe("B");
  });
});
