import { describe, it, expect } from "vitest";
import { folderPath, sanitizeSegment } from "@/core/drive/folder-path";

describe("folder path", () => {
  it("mirrors the checklist hierarchy", () => {
    expect(
      folderPath({
        candidateName: "John Doe",
        candidateId: "abc",
        stepOrder: 1,
        stepName: "Wafid Medical",
      })
    ).toEqual(["Candidates", "John Doe (abc)", "1-Wafid Medical"]);
  });

  it("sanitizes slashes and control chars", () => {
    expect(sanitizeSegment("A/B\\C\u0001")).toBe("A B C");
    expect(folderPath({ candidateName: "Ann/Bob", candidateId: "id/1", stepOrder: 2, stepName: "Pass\nport" })[1]).toBe(
      "Ann Bob (id 1)"
    );
  });

  it("respects length limits", () => {
    const long = "x".repeat(200);
    expect(sanitizeSegment(long).length).toBe(80);
  });
});
