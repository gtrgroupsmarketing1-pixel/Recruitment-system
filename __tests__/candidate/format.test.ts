import { describe, expect, it } from "vitest";
import {
  formatCandidateName,
  maskPhone,
} from "@/modules/candidate/components/format";

describe("candidate format", () => {
  it("collapses name whitespace", () => {
    expect(formatCandidateName({ fullName: "  John  Doe " })).toBe("John Doe");
  });

  it("masks phone keeping prefix and last 4", () => {
    expect(maskPhone("+919876543210")).toBe("+91******3210");
  });
});
