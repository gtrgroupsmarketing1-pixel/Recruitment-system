import { describe, it, expect } from "vitest";
import { assertStepUnlocked } from "@/modules/compliance/compliance.graph";
import { StageLockedError } from "@/lib/errors";

describe("stage lock", () => {
  it("allows a step with no dependency", () => {
    expect(() =>
      assertStepUnlocked({
        stepName: "Wafid",
        dependsOnName: null,
        dependsOnStatus: null,
      })
    ).not.toThrow();
  });

  it("blocks step 2 while step 1 is pending", () => {
    expect(() =>
      assertStepUnlocked({
        stepName: "Passport",
        dependsOnName: "Wafid",
        dependsOnStatus: "PENDING",
      })
    ).toThrow(StageLockedError);
  });

  it("allows step 2 after step 1 completed", () => {
    expect(() =>
      assertStepUnlocked({
        stepName: "Passport",
        dependsOnName: "Wafid",
        dependsOnStatus: "COMPLETED",
      })
    ).not.toThrow();
  });

  it("blocks step 4 when step 3 is pending", () => {
    expect(() =>
      assertStepUnlocked({
        stepName: "Visa",
        dependsOnName: "ECR",
        dependsOnStatus: "PENDING",
      })
    ).toThrow(StageLockedError);
  });
});
