import { describe, expect, it } from "vitest";
import { parseRealtimePayload, shouldDeliver } from "@/core/realtime/filter";

describe("realtime filter", () => {
  it("drops other tenants, unlisted types, and malformed payloads", () => {
    const connection = { tenantId: "A", eventTypes: new Set(["candidate.status_changed"]) };
    expect(shouldDeliver({ type: "candidate.status_changed", tenantId: "B" }, connection)).toBe(false);
    expect(shouldDeliver({ type: "task.overdue", tenantId: "A" }, connection)).toBe(false);
    expect(shouldDeliver({ type: "candidate.status_changed", tenantId: "A" }, connection)).toBe(true);
    expect(parseRealtimePayload("not-json")).toBeNull();
    expect(parseRealtimePayload(JSON.stringify({ type: "candidate.status_changed", tenantId: "A", payload: { applicationId: "1" } }))?.type).toBe("candidate.status_changed");
  });
});
