import { describe, it, expect } from "vitest";
import { storageKeyFor } from "@/modules/document/document.sanitize";

describe("storage keys", () => {
  it("always starts with tenants/{tenantId}/", () => {
    const key = storageKeyFor({
      tenantId: "t1",
      documentId: "d1",
      fileName: "passport.pdf",
      candidateId: "c1",
    });
    expect(key.startsWith("tenants/t1/")).toBe(true);
  });

  it("includes documentId", () => {
    const key = storageKeyFor({
      tenantId: "t1",
      documentId: "doc_99",
      fileName: "visa.pdf",
      checklistId: "chk",
    });
    expect(key).toContain("doc_99");
  });

  it("sanitizes filename", () => {
    const key = storageKeyFor({
      tenantId: "t1",
      documentId: "d1",
      fileName: "my passport (1).pdf",
      candidateId: "c1",
    });
    expect(key).not.toContain(" ");
    expect(key).not.toContain("(");
    expect(key.endsWith("my_passport__1_.pdf")).toBe(true);
  });
});
