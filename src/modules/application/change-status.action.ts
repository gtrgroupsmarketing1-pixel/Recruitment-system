"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { ValidationError } from "@/lib/errors";
import { ApplicationStatusSchema } from "./application.schema";
import { ApplicationService } from "./application.service";

export async function changeStatusAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId || !session.user.id) {
    throw new ValidationError("Missing session tenant");
  }
  const applicationId = String(formData.get("applicationId") ?? "");
  const requisitionId = String(formData.get("requisitionId") ?? "");
  const parsed = ApplicationStatusSchema.safeParse(
    String(formData.get("toStatus") ?? "")
  );
  if (!parsed.success) {
    throw new ValidationError("Invalid status");
  }
  await withTenant(tenantId, () =>
    ApplicationService.changeStatus(
      tenantId,
      session.user.id,
      applicationId,
      parsed.data
    )
  );
  if (requisitionId) {
    revalidatePath(`/requisitions/${requisitionId}`);
  }
}
