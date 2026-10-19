"use server";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { ClientCompanyService } from "./client-company.service";
import { z } from "zod";

const Schema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").max(10).toUpperCase(),
  country: z.string().optional(),
});

export async function createClientAction(formData: FormData) {
  let errorMsg = null;
  try {
    await withSessionScope(async (scope) => {
      const raw = Object.fromEntries(formData.entries());
      const parsed = Schema.safeParse(raw);
      if (!parsed.success) {
        throw new Error(Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Validation failed");
      }
      await ClientCompanyService.create(scope.tenantId, parsed.data);
    });
  } catch (err: any) {
    console.error("CLIENT_CREATE_ERROR:", err);
    errorMsg = err.message || "Failed to create client";
  }

  if (errorMsg) {
    redirect(`/admin/clients/new?error=${encodeURIComponent(errorMsg)}`);
  }

  redirect("/requisitions/new"); // Send them back to the requisition form after adding
}