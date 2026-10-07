import { describe, it, expect } from "vitest";
import { summarizeBottlenecks } from "@/modules/compliance/compliance.bottleneck";

describe("bottlenecks", () => {
  it("returns empty for no rows", () => {
    expect(summarizeBottlenecks([])).toEqual([]);
  });
  it("computes stuck percent and sorts by order", () => {
    const rows = summarizeBottlenecks([
      { stepName: "Visa", stepOrder: 4, casesStuck: 1, totalCases: 4, averageDaysStuck: 2 },
      { stepName: "Medical", stepOrder: 1, casesStuck: 5, totalCases: 5, averageDaysStuck: 3 },
    ]);
    expect(rows[0].stepName).toBe("Medical");
    expect(rows[0].pctStuck).toBe(100);
  });
});
