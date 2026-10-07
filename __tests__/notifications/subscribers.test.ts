import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { authPrisma, withTenant, db } from "@/core/db/client";
import { eventBus } from "@/core/events/event-bus";
import { registerNotificationSubscribers } from "@/modules/notification/notification.subscribers";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe("notification subscribers", () => {
  let tenantId: string;
  let candidateId: string;
  let unsub: (() => void) | null = null;

  beforeAll(async () => {
    if (!hasDb) return;
    tenantId = `ns-${randomUUID().slice(0, 8)}`;
    candidateId = `c-${randomUUID().slice(0, 8)}`;
    await authPrisma.tenant.create({
      data: {
        id: tenantId,
        name: "Sub Tenant",
        slug: `sub-${tenantId}`,
      },
    });
    await authPrisma.candidate.create({
      data: {
        id: candidateId,
        tenantId,
        fullName: "Test Candidate",
        phone: "+971500000099",
      },
    });
    unsub = registerNotificationSubscribers();
  });

  afterAll(() => {
    if (unsub) unsub();
  });

  it.skipIf(!hasDb)("candidate.status_changed → one Notification row", async () => {
    await withTenant(tenantId, async () => {
      await eventBus.publish({
        type: "candidate.status_changed",
        tenantId,
        payload: {
          applicationId: "app-1",
          candidateId,
          requisitionId: "req-1",
          from: "SHORTLISTED",
          to: "SELECTED",
          actorId: "actor-1",
        },
      });
    });

    // withTenant already dispatches pending after commit
    const rows = await withTenant(tenantId, () =>
      db.notification.findMany({
        where: { tenantId, templateKey: "candidate.status_changed" },
      })
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].channel).toBe("WHATSAPP");
    expect(rows[0].status).toBe("SENT");
  });

  it.skipIf(!hasDb)("candidate with no phone/email → zero new rows", async () => {
    const silentId = `c-silent-${randomUUID().slice(0, 6)}`;
    await authPrisma.candidate.create({
      data: {
        id: silentId,
        tenantId,
        fullName: "Silent",
        phone: null,
        email: null,
      },
    });
    const before = await withTenant(tenantId, () =>
      db.notification.count({ where: { tenantId } })
    );
    await withTenant(tenantId, async () => {
      await eventBus.publish({
        type: "candidate.status_changed",
        tenantId,
        payload: {
          applicationId: "app-2",
          candidateId: silentId,
          requisitionId: "req-1",
          from: "SOURCED",
          to: "SCREENED",
          actorId: "actor-1",
        },
      });
    });
    const after = await withTenant(tenantId, () =>
      db.notification.count({ where: { tenantId } })
    );
    expect(after).toBe(before);
  });
});
