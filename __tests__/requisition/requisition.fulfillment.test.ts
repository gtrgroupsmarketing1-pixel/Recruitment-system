import { describe, expect, it } from "vitest";
import { computeFulfillmentPct } from "@/modules/requisition/requisition.metrics";

describe("computeFulfillmentPct", () => {
  it("0 of 10 → 0%", () => {
    expect(computeFulfillmentPct(0, 10)).toBe(0);
  });
  it("5 of 10 → 50%", () => {
    expect(computeFulfillmentPct(5, 10)).toBe(50);
  });
  it("10 of 10 → 100%", () => {
    expect(computeFulfillmentPct(10, 10)).toBe(100);
  });
  it("15 of 10 → 100% clamped", () => {
    expect(computeFulfillmentPct(15, 10)).toBe(100);
  });
  it("target 0 → 0%", () => {
    expect(computeFulfillmentPct(3, 0)).toBe(0);
  });
});
