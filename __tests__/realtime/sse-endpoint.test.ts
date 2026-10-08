import { describe, expect, it } from "vitest";
import { realtimeAccess, shouldDeliver } from "@/core/realtime/filter";

describe("sse endpoint access", () => {
  it("rejects missing and client sessions, and isolates tenants", () => {
    expect(realtimeAccess(null)).toBe("unauthorized");
    expect(realtimeAccess({ tenantId: "t", role: "CLIENT_USER" })).toBe("unauthorized");
    expect(realtimeAccess({ tenantId: "t", role: "RECRUITER" })).toBe("ok");
    expect(shouldDeliver(
      { type: "candidate.status_changed", tenantId: "B" },
      { tenantId: "A", eventTypes: new Set(["candidate.status_changed"]) }
    )).toBe(false);
  });
});
