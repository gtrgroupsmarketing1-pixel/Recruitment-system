import { describe, it, expect } from "vitest";
import { ALLOWED_MIME, isMimeAllowed } from "@/modules/document/document.mime";

describe("mime allowlist", () => {
  it("rejects text/html everywhere", () => {
    for (const type of Object.keys(ALLOWED_MIME) as Array<keyof typeof ALLOWED_MIME>) {
      expect(isMimeAllowed(type, "text/html")).toBe(false);
    }
  });
  it("allows pdf for passport", () => {
    expect(isMimeAllowed("PASSPORT", "application/pdf")).toBe(true);
  });
});
