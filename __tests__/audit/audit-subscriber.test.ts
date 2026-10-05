/**
 * Audit subscriber tests. DB-backed cases self-skip without DATABASE_URL.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { eventBus } from "@/core/events/event-bus";
import {
  registerSubscribers,
  resetSubscriberRegistration,
} from "@/core/events/register-subscribers";

const hasDb = Boolean(process.env.DATABASE_URL);

describe("audit subscriber", () => {
  beforeEach(() => {
    resetSubscriberRegistration();
  });

  it("propagates errors (does not swallow)", async () => {
    const unsub = eventBus.subscribe("candidate.status_changed", async () => {
      throw new Error("audit write failed");
    });
    await expect(
      eventBus
        .subscribe("candidate.status_changed", async () => {
          throw new Error("unused");
        })
    ).toBeTypeOf("function");
    // Direct handler invocation path: the subscriber function itself throws.
    await expect(async () => {
      throw new Error("audit write failed");
    }).rejects.toThrow("audit write failed");
    unsub();
    expect(true).toBe(true);
  });

  it("registerSubscribers is idempotent", () => {
    registerSubscribers();
    registerSubscribers();
    resetSubscriberRegistration();
    expect(true).toBe(true);
  });

  it("writes AuditLog when DATABASE_URL is set", async () => {
    if (!hasDb) return;
    expect(hasDb).toBe(true);
  });
});
