import { describe, expect, it } from "vitest";
import { computeSlaFlag } from "@/modules/requisition/requisition.metrics";

function daysFrom(today: Date, days: number): Date {
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + days));
}

describe("computeSlaFlag", () => {
  const today = new Date("2026-10-06T12:00:00Z");

  it("45 days out → GREEN", () => {
    expect(computeSlaFlag(daysFrom(today, 46), today)).toBe("GREEN");
  });

  it("40 days out → AMBER", () => {
    expect(computeSlaFlag(daysFrom(today, 40), today)).toBe("AMBER");
  });

  it("31 days out → AMBER", () => {
    expect(computeSlaFlag(daysFrom(today, 31), today)).toBe("AMBER");
  });

  it("30 days out → AMBER (strict < 30 for RED)", () => {
    expect(computeSlaFlag(daysFrom(today, 30), today)).toBe("AMBER");
  });

  it("29 days out → RED", () => {
    expect(computeSlaFlag(daysFrom(today, 29), today)).toBe("RED");
  });

  it("0 days out → RED", () => {
    expect(computeSlaFlag(daysFrom(today, 0), today)).toBe("RED");
  });

  it("-5 days out → RED", () => {
    expect(computeSlaFlag(daysFrom(today, -5), today)).toBe("RED");
  });

  it("null target → null", () => {
    expect(computeSlaFlag(null, today)).toBeNull();
  });
});
