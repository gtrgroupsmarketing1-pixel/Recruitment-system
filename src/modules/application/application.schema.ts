import { z } from "zod";

/** All 21 frozen ApplicationStatus values. SCREAMING_SNAKE only. */
export const ApplicationStatusSchema = z.enum([
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
]);

export const CreateApplicationInput = z
  .object({
    candidateId: z.string().min(1),
    requisitionId: z.string().min(1),
    recruiterId: z.string().optional(),
  })
  .strict();

export type CreateApplicationInput = z.infer<typeof CreateApplicationInput>;
