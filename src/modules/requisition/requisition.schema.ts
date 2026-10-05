import { z } from "zod";

export const CountryCode = z.enum(["AE", "SA", "QA", "KW", "BH", "OM"]);
export const RoleCategoryCode = z
  .string()
  .min(2)
  .max(4)
  .regex(/^[A-Z0-9]+$/, "Role category code must be 2–4 uppercase chars");

export const ReqStatusSchema = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "FILLED",
  "CANCELLED",
  "ON_HOLD",
]);

export const CreateRequisitionInput = z
  .object({
    clientCompanyId: z.string().min(1),
    roleCategory: RoleCategoryCode,
    country: CountryCode,
    vacancyTarget: z.number().int().positive(),
    location: z.string().optional(),
    targetOnboardingDate: z.coerce.date().optional(),
    notes: z.string().optional(),
    assignedRecruiterId: z.string().optional(),
  })
  .strict();

export const UpdateRequisitionInput = z
  .object({
    id: z.string().min(1),
    roleCategory: RoleCategoryCode.optional(),
    country: CountryCode.optional(),
    vacancyTarget: z.number().int().positive().optional(),
    location: z.string().nullable().optional(),
    targetOnboardingDate: z.coerce.date().nullable().optional(),
    notes: z.string().nullable().optional(),
    status: ReqStatusSchema.optional(),
  })
  .strict();

export const ListRequisitionInput = z
  .object({
    status: ReqStatusSchema.optional(),
    clientCompanyId: z.string().optional(),
    search: z.string().optional(),
  })
  .strict();

export const AssignRecruiterInput = z
  .object({
    id: z.string().min(1),
    recruiterId: z.string().min(1),
  })
  .strict();

export const RequisitionIdInput = z.object({ id: z.string().min(1) }).strict();

export type CreateRequisitionInput = z.infer<typeof CreateRequisitionInput>;
export type UpdateRequisitionInput = z.infer<typeof UpdateRequisitionInput>;
export type ListRequisitionInput = z.infer<typeof ListRequisitionInput>;
