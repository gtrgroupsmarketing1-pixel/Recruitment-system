import { z } from "zod";

/** No encryption logic here — middleware encrypts on write. Plain fields only. */
export const CreateCandidateInput = z
  .object({
    fullName: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    passportNumber: z.string().optional(),
    nationalId: z.string().optional(),
    medicalResult: z.string().optional(),
    requisitionId: z.string().optional(),
    smsOptIn: z.boolean().optional(),
  })
  .strict();

export const UpdateCandidateInput = z
  .object({
    fullName: z.string().min(1).optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    passportNumber: z.string().nullable().optional(),
    nationalId: z.string().nullable().optional(),
    medicalResult: z.string().nullable().optional(),
    smsOptIn: z.boolean().optional(),
  })
  .strict();

export const ListCandidateInput = z
  .object({
    search: z.string().optional(),
  })
  .strict();

export type CreateCandidateInput = z.infer<typeof CreateCandidateInput>;
export type UpdateCandidateInput = z.infer<typeof UpdateCandidateInput>;
