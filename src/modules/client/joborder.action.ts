"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { JobOrderService } from "./joborder.service";

const JobOrderSchema = z.object({
  roleTitle: z.string().min(1),
  roleCategory: z.string().min(1),
  country: z.string().min(2).max(2).default("AE"),
  vacancyCount: z.coerce.number().int().positive(),
  description: z.string().optional().nullable(),
});

export async function submitJobOrderAction(formData: FormData) {
  const parsed = JobOrderSchema.safeParse({
    roleTitle: formData.get("roleTitle"),
    roleCategory: formData.get("roleCategory"),
    country: formData.get("country") || "AE",
    vacancyCount: formData.get("vacancyCount") ?? 1,
    description: formData.get("description") || null,
  });
  if (!parsed.success) redirect("/client/job-orders/new?error=invalid");
  const created = await withSessionScope(async (scope) => {
    requirePermission("joborder:submit");
    return JobOrderService.submit(scope.tenantId, scope.userId, {
      roleTitle: parsed.data.roleTitle,
      roleCategory: parsed.data.roleCategory,
      country: parsed.data.country,
      vacancyCount: parsed.data.vacancyCount,
      description: parsed.data.description || null,
    });
  });
  redirect(`/client/job-orders/${created.id}`);
}
