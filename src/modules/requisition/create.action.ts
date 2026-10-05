"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { CreateRequisitionInput } from "./requisition.schema";
import { RequisitionService } from "./requisition.service";

export type CreateFormState = { errors?: Record<string, string[]> };

export async function createRequisitionAction(
  _prev: CreateFormState,
  formData: FormData
): Promise<CreateFormState> {
  const session = await requireSession();
  const raw = Object.fromEntries(formData.entries());
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== "string") continue;
    if (value.trim() === "") continue;
    payload[key] = key === "vacancyTarget" ? Number(value) : value;
  }
  const parsed = CreateRequisitionInput.safeParse(payload);
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId || !session.user.id) {
    return { errors: { form: ["Missing session tenant"] } };
  }
  await withTenant(tenantId, () =>
    RequisitionService.create(tenantId, session.user.id, parsed.data)
  );
  redirect("/requisitions");
}
