"use server";
import { z } from "zod";

import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ValidationError } from "@/lib/errors";
import { TaskService } from "./task.service";

const TaskCompleteSchema = z.object({ taskId: z.string().min(1) });

export async function completeTaskAction(formData: FormData): Promise<void> {
  await withSessionScope(async (scope) => {
    requirePermission("task:update");
    const parsed = TaskCompleteSchema.safeParse({ taskId: formData.get("taskId") });
    if (!parsed.success) throw new ValidationError("Missing task id");
    const { taskId } = parsed.data;
    await TaskService.update(scope.tenantId, scope.userId, taskId, {
      status: "COMPLETED",
    });
    revalidatePath("/");
    revalidatePath("/tasks");
  });
}
