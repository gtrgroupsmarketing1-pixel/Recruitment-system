import { describe, it, expect } from "vitest";
import { assessRisk } from "@/modules/compliance/compliance.risk";

const today = new Date("2026-06-10T00:00:00.000Z");

describe("assessRisk", () => {
  it("is low when every step is complete", () => {
    const risk = assessRisk({
      caseCreatedAt: today,
      targetOnboardingDate: new Date("2026-07-01T00:00:00.000Z"),
      today,
      checklists: [{ stepOrder: 1, name: "Medical", status: "COMPLETE", dueDate: today }],
    });
    expect(risk.level).toBe("LOW");
    expect(risk.score).toBe(0);
    expect(risk.blockingStepName).toBeNull();
  });

  it("is critical when overdue more than 14 days and target is close", () => {
    const risk = assessRisk({
      caseCreatedAt: new Date("2026-05-01T00:00:00.000Z"),
      targetOnboardingDate: new Date("2026-06-14T00:00:00.000Z"),
      today,
      checklists: [{ stepOrder: 2, name: "Visa", status: "PENDING", dueDate: new Date("2026-05-01T00:00:00.000Z") }],
    });
    expect(risk.score).toBe(65);
    expect(risk.level).toBe("HIGH");
    expect(risk.reasons.join(" ")).toContain("14 days");
  });

  it("uses the highest overdue bucket once", () => {
    const risk = assessRisk({
      caseCreatedAt: today,
      targetOnboardingDate: null,
      today,
      checklists: [
        { stepOrder: 1, name: "A", status: "PENDING", dueDate: new Date("2026-06-01T00:00:00.000Z") },
        { stepOrder: 2, name: "B", status: "PENDING", dueDate: new Date("2026-05-01T00:00:00.000Z") },
      ],
    });
    expect(risk.score).toBe(40);
    expect(risk.blockingStepName).toBe("A");
  });

  it("adds 35 when the target is missed", () => {
    const risk = assessRisk({
      caseCreatedAt: today,
      targetOnboardingDate: new Date("2026-06-01T00:00:00.000Z"),
      today,
      checklists: [],
    });
    expect(risk.score).toBe(35);
    expect(risk.daysUntilTarget).toBeLessThan(0);
  });

  it("crosses level boundaries", () => {
    expect(assessRisk({ caseCreatedAt: today, targetOnboardingDate: null, today, checklists: [] }).level).toBe("LOW");
  });
});
