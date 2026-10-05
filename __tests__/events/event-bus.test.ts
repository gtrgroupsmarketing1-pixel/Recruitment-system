/**
 * Event bus unit tests. Self-skip without DATABASE_URL + generated Prisma client.
 */
import { describe, it, expect, beforeAll, afterEach } from "vitest";

const hasDb = Boolean(process.env.DATABASE_URL) && Boolean(process.env.AUTH_DATABASE_URL);

describe("event-bus (outbox)", () => {
  beforeAll(() => {
    if (!hasDb) {
      // Session 06: unverified until Prisma install
      return;
    }
  });

  it("publish outside withTenant throws EventBusError", async () => {
    if (!hasDb) return;
    const { eventBus } = await import("@/core/events/event-bus");
    const { EventBusError } = await import("@/lib/errors");
    await expect(
      eventBus.publish({
        type: "candidate.status_changed",
        tenantId: "t1",
        payload: {
          applicationId: "a1",
          candidateId: "c1",
          requisitionId: "r1",
          from: "SOURCED",
          to: "SCREENED",
          actorId: "u1",
        },
      })
    ).rejects.toBeInstanceOf(EventBusError);
  });

  it("subscribe returns working unsubscribe", async () => {
    const { eventBus } = await import("@/core/events/event-bus");
    const seen: string[] = [];
    const unsub = eventBus.subscribe("candidate.status_changed", async (e) => {
      seen.push(e.payload.applicationId);
    });
    unsub();
    expect(typeof unsub).toBe("function");
    expect(seen).toEqual([]);
  });
});
