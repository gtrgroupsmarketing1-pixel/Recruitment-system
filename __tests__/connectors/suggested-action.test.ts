import { describe, it, expect } from "vitest";
import { suggestedActionFor } from "@/core/connectors/suggested-action";

describe("suggestedActionFor", () => {
  it("APPROVED → COMPLETE_STEP", () => {
    expect(suggestedActionFor("APPROVED")).toBe("COMPLETE_STEP");
  });
  it("REJECTED → REVIEW", () => {
    expect(suggestedActionFor("REJECTED")).toBe("REVIEW");
  });
  it("EXPIRED → REVIEW", () => {
    expect(suggestedActionFor("EXPIRED")).toBe("REVIEW");
  });
  it("IN_PROGRESS → null", () => {
    expect(suggestedActionFor("IN_PROGRESS")).toBeNull();
  });
  it("UNKNOWN → null", () => {
    expect(suggestedActionFor("UNKNOWN")).toBeNull();
  });
});
