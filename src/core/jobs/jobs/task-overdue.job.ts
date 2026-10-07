/**
 * Hourly scan for open tasks past due that have not been notified.
 * Uses authPrisma (BYPASSRLS) to scan across tenants, then publishes
 * task.overdue inside a per-tenant withTenant transaction.
 */
import { authPrisma, withTenant, db } from "@/core/db/client";
import { eventBus } from "@/core/events/event-bus";
import { logger } from "@/lib/logger";
import { runJob } from "@/core/jobs/run-job";

export async function runTaskOverdueJob(): Promise<{ processed: number }> {
  const now = new Date();
  const tasks = await authPrisma.task.findMany({
    where: {
      status: "OPEN",
      dueDate: { lt: now },
      notifiedOverdueAt: null,
      deletedAt: null,
    },
    select: {
      id: true,
      tenantId: true,
      dueDate: true,
      assigneeId: true,
    },
    take: 500,
  });

  let processed = 0;
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const daysOverdue = Math.floor(
      (now.getTime() - task.dueDate.getTime()) / 86_400_000
    );

    await withTenant(task.tenantId, async () => {
      await eventBus.publish({
        type: "task.overdue",
        tenantId: task.tenantId,
        payload: {
          taskId: task.id,
          dueDate: task.dueDate!.toISOString(),
          daysOverdue,
          assigneeId: task.assigneeId,
        },
      });
      await db.task.updateMany({
        where: { id: task.id, tenantId: task.tenantId },
        data: { notifiedOverdueAt: now },
      });
    });
    processed += 1;
  }

  logger.info({ processed }, "task-overdue job complete");
  return { processed };
}
