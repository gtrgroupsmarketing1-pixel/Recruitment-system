import { describe, expect, it } from "vitest";
import { ApplicationStatusSchema } from "@/modules/application/application.schema";

const ALL = [
  "SOURCED",
  "SCREENED",
  "SHORTLISTED",
  "CLIENT_INTERVIEWED",
  "SELECTED",
  "MEDICAL_BOOKED",
  "MEDICAL_CLEARED",
  "DOCUMENTS_IN_ATTESTATION",
  "ATTESTATION_CLEARED",
  "VISA_APPLIED",
  "VISA_STAMPED",
  "TICKET_BOOKED",
  "TRAVELED",
  "MOBILIZED",
  "PROBATION",
  "CONFIRMED",
  "REJECTED",
  "ON_HOLD",
  "MEDICAL_UNFIT",
  "VISA_REFUSED",
  "ABSCONDED",
] as const;

describe("ApplicationStatusSchema", () => {
  it("accepts each of 21 values", () => {
    expect(ALL).toHaveLength(21);
    for (const value of ALL) {
      expect(ApplicationStatusSchema.safeParse(value).success).toBe(true);
    }
  });

  it("rejects INVALID", () => {
    expect(ApplicationStatusSchema.safeParse("INVALID").success).toBe(false);
  });

  it("rejects lowercase", () => {
    expect(ApplicationStatusSchema.safeParse("sourced").success).toBe(false);
  });
});
