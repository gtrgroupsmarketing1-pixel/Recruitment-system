import { describe, expect, it } from "vitest";
import { displayName, projectClientCandidate } from "@/modules/client/client.projection";

describe("projectClientCandidate", () => {
  it("truncates surname and drops non-visible documents", () => {
    expect(displayName("John Doe")).toBe("John D.");
    const view = projectClientCandidate({
      applicationId: "a",
      candidateId: "c",
      fullName: "John Doe",
      roleCategory: "DRV",
      currentStatus: "SHORTLISTED",
      documents: [
        { id: "1", label: "Passport", fileName: "p.pdf", clientVisible: false },
        { id: "2", label: "Offer", fileName: "o.pdf", clientVisible: true },
      ],
    });
    expect(view.displayName).toBe("John D.");
    expect(view.documents).toEqual([{ id: "2", label: "Offer", fileName: "o.pdf" }]);
    expect(view).not.toHaveProperty("passportNumber");
    expect(view).not.toHaveProperty("phone");
    expect(view).not.toHaveProperty("email");
    expect(view).not.toHaveProperty("medicalResult");
    expect(JSON.stringify(view)).not.toContain("passport");
  });
});
