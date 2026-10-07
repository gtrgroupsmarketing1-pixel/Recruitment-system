import { describe, it, expect } from "vitest";
import { daysRemaining, isExpiringWithin } from "@/modules/document/document.expiry";

describe("document expiry", () => {
  const now = Date.UTC(2026, 5, 10);
  it("flags within 7 days", () => {
    const expiry = new Date(Date.UTC(2026, 5, 15));
    expect(daysRemaining(expiry, now)).toBeLessThanOrEqual(7);
    expect(isExpiringWithin(expiry, now, 7)).toBe(true);
  });
  it("flags past dates", () => {
    const expiry = new Date(Date.UTC(2026, 5, 1));
    expect(daysRemaining(expiry, now)).toBeLessThan(0);
    expect(isExpiringWithin(expiry, now, 30)).toBe(true);
  });
});
