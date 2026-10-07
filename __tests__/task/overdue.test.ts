import { describe, it, expect } from "vitest";
import { computeIsOverdue } from "@/modules/task/task.overdue";

describe("computeIsOverdue", () => {
  const now = Date.UTC(2026, 0, 15, 12, 0, 0);

  it("OPEN + past due → true", () => {
    expect(
      computeIsOverdue("OPEN", new Date(Date.UTC(2026, 0, 14)), now)
    ).toBe(true);
  });

  it("OPEN + future due → false", () => {
    expect(
      computeIsOverdue("OPEN", new Date(Date.UTC(2026, 0, 16)), now)
    ).toBe(false);
  });

  it("COMPLETED + past due → false", () => {
    expect(
      computeIsOverdue("COMPLETED", new Date(Date.UTC(2026, 0, 14)), now)
    ).toBe(false);
  });

  it("OPEN + null due → false", () => {
    expect(computeIsOverdue("OPEN", null, now)).toBe(false);
  });
});
