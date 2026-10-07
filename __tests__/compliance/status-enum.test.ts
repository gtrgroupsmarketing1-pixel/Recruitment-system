import { ChecklistStatus } from "@prisma/client";
import { describe, it, expect } from "vitest";

describe("compliance status enum", () => {
  it("has COMPLETE and not COMPLETED", () => {
    expect(Object.values(ChecklistStatus)).toContain("COMPLETE");
    expect(Object.values(ChecklistStatus)).not.toContain("COMPLETED");
  });
});
