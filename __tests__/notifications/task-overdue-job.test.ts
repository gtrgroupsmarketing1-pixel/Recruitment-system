import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID } from "node:crypto";
import { authPrisma, withTenant, db } from "@/core/db/client";
import { runTaskOverdueJob } from "@/core/jobs/jobs/task-overdue.job";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe("task-overdue job", () => {
  let tenantId: string;
  let taskId: string;
  let userId: string;

  beforeAll(async () => {
    if (!hasDb) return;
    tenantId = `toj-${randomUUID().slice(0, 8)}`;
    userId = `u-${randomUUID().slice(0, 8)}`;
    taskId = `t-${randomUUID().slice(0, 8)}`;
    await authPrisma.tenant.create({
      data: {
        id: tenantId,
        name: "Overdue Tenant",
        slug: `overdue-${tenantId}`,
      },
    });
    await authPrisma.user.create({
      data: {
        id: userId,
        tenantId,
        email: `overdue-${userId}@example.com`,
        name: "Assignee",
        role: "RECRUITER",
      },
    });
    await authPrisma.task.create({
      data: {
        id: taskId,
        tenantId,
        assigneeId: userId,
        type: "CUSTOM",
        refType: "CandidateApplication",
        refId: "app-x",
        title: "Overdue task",
        dueDate: new Date(Date.now() - 2 * 86_400_000),
        status: "OPEN",
        priority: "MEDIUM",
        notifiedOverdueAt: null,
      },
    });
  });

  it.skipIf(!hasDb)("one overdue task → event published, notifiedOverdueAt set", async () => {
    const result = await runTaskOverdueJob();
    expect(result.processed).toBeGreaterThanOrEqual(1);

    const task = await authPrisma.task.findFirst({
      where: { id: taskId, tenantId },
    });
    expect(task?.notifiedOverdueAt).not.toBeNull();

    const events = await withTenant(tenantId, () =>
      db.domainEvent.findMany({
        where: { tenantId, type: "task.overdue" },
      })
    );
    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  it.skipIf(!hasDb)("running twice → no duplicate events for same task", async () => {
    const before = await withTenant(tenantId, () =>
      db.domainEvent.count({
        where: { tenantId, type: "task.overdue" },
      })
    );
    await runTaskOverdueJob();
    const after = await withTenant(tenantId, () =>
      db.domainEvent.count({
        where: { tenantId, type: "task.overdue" },
      })
    );
    expect(after).toBe(before);
  });
});
