import { describe, it, expect } from "vitest";
import { wafidConnector } from "@/core/connectors/wafid.connector";

describe("wafid validateTrackingId", () => {
  it("accepts 10 digits", () => {
    expect(wafidConnector.validateTrackingId("1234567890").valid).toBe(true);
  });
  it("rejects short ids", () => {
    expect(wafidConnector.validateTrackingId("12345").valid).toBe(false);
  });
  it("rejects non-numeric", () => {
    expect(wafidConnector.validateTrackingId("abc123").valid).toBe(false);
  });
});
