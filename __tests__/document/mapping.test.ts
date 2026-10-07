import { describe, it, expect } from "vitest";
import { mapRequiredDoc } from "@/modules/compliance/document-mapping";

describe("required doc mapping", () => {
  it("maps passport_copy", () => {
    expect(mapRequiredDoc("passport_copy")).toBe("PASSPORT");
  });
  it("returns undefined for unknown names", () => {
    expect(mapRequiredDoc("mystery")).toBeUndefined();
  });
});
