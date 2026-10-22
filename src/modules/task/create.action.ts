"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ValidationError } from "@/lib/errors";
import { TaskService } from "./task.service";

const Schema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export async function createTaskAction(formData: FormData) {
  const parsed = Schema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || null,
    dueDate: formData.get("dueDate") || null,
    priority: formData.get("priority") || "MEDIUM",
  });
  if (!parsed.success) {
    redirect("/tasks?error=" + encodeURIComponent("Invalid task data"));
  }
  try {
    await withSessionScope(async (scope) => {
      requirePermission("task:update");
      const due =
        parsed.data.dueDate && String(parsed.data.dueDate).trim()
          ? new Date(String(parsed.data.dueDate))
          : null;
      await TaskService.createManual(scope.tenantId, scope.userId, {
        title: parsed.data.title,
        description: parsed.data.description,
        dueDate: due && !Number.isNaN(due.getTime()) ? due : null,
        priority: parsed.data.priority,
      });
    });
  } catch (error) {
    const msg =
      error instanceof ValidationError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Could not create task";
    redirect(`/tasks?error=${encodeURIComponent(msg)}`);
  }
  redirect("/tasks");
}
