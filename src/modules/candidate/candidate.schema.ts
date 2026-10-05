import { z } from "zod";

/** No encryption logic here — Session 04. Plain fields only. */
export const CreateCandidateInput = z.object({
  fullName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  passportNumber: z.string().optional(),
  nationalId: z.string().optional(),
});

export type CreateCandidateInput = z.infer<typeof CreateCandidateInput>;
