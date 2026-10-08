"use server";

import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ValidationError } from "@/lib/errors";
import { TaskService } from "./task.service";

export async function completeTaskAction(formData: FormData): Promise<void> {
  await withSessionScope(async (scope) => {
    requirePermission("task:update");
    const taskId = String(formData.get("taskId") ?? "");
    if (!taskId) throw new ValidationError("Missing task id");
    await TaskService.update(scope.tenantId, scope.userId, taskId, {
      status: "COMPLETED",
    });
    revalidatePath("/");
    revalidatePath("/tasks");
  });
}
