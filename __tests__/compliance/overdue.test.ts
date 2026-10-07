import { describe, it, expect } from "vitest";
import { computeChecklistOverdue, computeStageLocked } from "@/modules/compliance/compliance.overdue";

describe("checklist overdue", () => {
  const now = Date.UTC(2026, 5, 10);
  it("complete is never overdue", () => {
    expect(computeChecklistOverdue("COMPLETE", new Date(Date.UTC(2026, 5, 1)), now)).toBe(false);
  });
  it("pending past due is overdue", () => {
    expect(computeChecklistOverdue("PENDING", new Date(Date.UTC(2026, 5, 1)), now)).toBe(true);
  });
  it("pending future is not overdue", () => {
    expect(computeChecklistOverdue("PENDING", new Date(Date.UTC(2026, 5, 20)), now)).toBe(false);
  });
  it("null due date is not overdue", () => {
    expect(computeChecklistOverdue("PENDING", null, now)).toBe(false);
  });
  it("locks when predecessor is not complete", () => {
    expect(computeStageLocked("PENDING")).toBe(true);
    expect(computeStageLocked("COMPLETE")).toBe(false);
    expect(computeStageLocked(null)).toBe(false);
  });
});
