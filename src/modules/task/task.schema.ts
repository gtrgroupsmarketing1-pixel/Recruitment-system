import { z } from "zod";

export const UpdateTaskInput = z
  .object({
    status: z
      .enum(["OPEN", "IN_PROGRESS", "COMPLETED", "OVERDUE", "CANCELLED"])
      .optional(),
    notes: z.string().nullable().optional(),
    dueDate: z.coerce.date().nullable().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  })
  .strict();

export type UpdateTaskInput = z.infer<typeof UpdateTaskInput>;
