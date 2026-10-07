import { describe, it, expect } from "vitest";
import { suggestedActionFor } from "@/core/connectors/suggested-action";

/**
 * Full DB subscriber test is covered when officers exist; pure contract here.
 * Integration path: event payload → suggestedAction mapping.
 */
describe("connector status notification contract", () => {
  it("maps statuses to suggested actions for the template", () => {
    expect(suggestedActionFor("APPROVED")).toBe("COMPLETE_STEP");
    expect(suggestedActionFor("REJECTED")).toBe("REVIEW");
  });
});
