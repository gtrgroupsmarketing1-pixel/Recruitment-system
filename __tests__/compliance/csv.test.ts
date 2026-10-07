import { describe, it, expect } from "vitest";
import { toCsv } from "@/modules/compliance/compliance.dashboard.csv";

describe("csv", () => {
  it("writes a header and escapes commas", () => {
    const csv = toCsv([{ candidateName: "A, B", requisitionCode: 'X"Y', riskLevel: "HIGH", score: 50, blockingStepName: "Visa", daysUntilTarget: 3 }]);
    expect(csv.split("\n")[0]).toContain("candidate");
    expect(csv).toContain('"A, B"');
    expect(csv).toContain('"X""Y"');
  });
  it("returns header only when empty", () => {
    expect(toCsv([]).split("\n")).toHaveLength(1);
  });
});
