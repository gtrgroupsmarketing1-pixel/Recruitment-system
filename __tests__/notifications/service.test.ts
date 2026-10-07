import { describe, it, expect, beforeAll } from "vitest";
import { NotificationService } from "@/modules/notification/notification.service";
import { NotFoundError } from "@/lib/errors";
import { withTenant, authPrisma } from "@/core/db/client";
import { randomUUID } from "node:crypto";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe("NotificationService", () => {
  let tenantId: string;

  beforeAll(async () => {
    if (!hasDb) return;
    tenantId = `ntf-${randomUUID().slice(0, 8)}`;
    await authPrisma.tenant.create({
      data: {
        id: tenantId,
        name: "Notify Tenant",
        slug: `notify-${tenantId}`,
      },
    });
  });

  it.skipIf(!hasDb)("send creates Notification and updates to SENT", async () => {
    const row = await withTenant(tenantId, () =>
      NotificationService.send(
        tenantId,
        "candidate.status_changed",
        { type: "CANDIDATE", id: "cand-1", addr: "+971500000001" },
        {
          candidateName: "Ravi",
          status: "SELECTED",
          requisitionCode: "REQ-1",
        }
      )
    );
    expect(row.status).toBe("SENT");
    expect(row.providerId?.startsWith("log-")).toBe(true);
    expect(row.templateKey).toBe("candidate.status_changed");
    expect(row.channel).toBe("WHATSAPP");
    expect(row.sentAt).not.toBeNull();
  });

  it.skipIf(!hasDb)("unknown templateKey throws NotFoundError", async () => {
    await expect(
      withTenant(tenantId, () =>
        NotificationService.send(
          tenantId,
          "does.not.exist",
          { type: "USER", id: null, addr: "x@y.com" },
          {}
        )
      )
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it.skipIf(!hasDb)("listForTenant returns created rows", async () => {
    await withTenant(tenantId, () =>
      NotificationService.send(
        tenantId,
        "task.overdue",
        { type: "USER", id: "u1", addr: "u@example.com" },
        {
          taskTitle: "Do thing",
          dueDate: "2026-01-01",
          refType: "Task",
          refId: "t1",
        }
      )
    );
    const list = await withTenant(tenantId, () =>
      NotificationService.listForTenant(tenantId, { limit: 50 })
    );
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.every((n) => n.templateKey.length > 0)).toBe(true);
  });
});
