import { z } from "zod";

export const CreateRequisitionInput = z.object({
  clientCompanyId: z.string(),
  roleCategory: z.string().min(1),
  country: z.string().min(1),
  vacancyTarget: z.number().int().positive(),
  location: z.string().optional(),
  targetOnboardingDate: z.coerce.date().optional(),
});

export type CreateRequisitionInput = z.infer<typeof CreateRequisitionInput>;
