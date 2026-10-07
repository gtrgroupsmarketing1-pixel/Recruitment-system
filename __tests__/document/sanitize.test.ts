import { describe, it, expect } from "vitest";
import { sanitizeFilename, storageKeyFor } from "@/modules/document/document.sanitize";

describe("sanitize filename", () => {
  it("replaces spaces", () => {
    expect(sanitizeFilename("passport page 1.jpg")).toBe("passport_page_1.jpg");
  });
  it("neutralizes traversal", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe(".._.._etc_passwd");
  });
  it("truncates to 100", () => {
    expect(sanitizeFilename("a".repeat(140)).length).toBe(100);
  });
  it("includes tenant and document id in the key", () => {
    const key = storageKeyFor({ tenantId: "t1", documentId: "d1", fileName: "a.jpg", candidateId: "c1" });
    expect(key).toContain("tenants/t1/");
    expect(key).toContain("/d1/");
  });
});
