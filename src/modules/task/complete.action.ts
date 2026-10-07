"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { ValidationError } from "@/lib/errors";
import { TaskService } from "./task.service";

export async function completeTaskAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId || !session.user.id) {
    throw new ValidationError("Missing session tenant");
  }
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) throw new ValidationError("Missing task id");
  await withTenant(tenantId, () =>
    TaskService.update(tenantId, session.user.id, taskId, {
      status: "COMPLETED",
    })
  );
  revalidatePath("/");
  revalidatePath("/tasks");
}
