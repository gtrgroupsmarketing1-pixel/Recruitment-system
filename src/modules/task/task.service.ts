import type { Task, TaskPriority, TaskStatus } from "@prisma/client";
import { NotFoundError } from "@/lib/errors";
import { TaskRepo } from "./task.repo";
import { computeIsOverdue } from "./task.overdue";

export type TaskView = {
  id: string;
  type: Task["type"];
  title: string;
  description: string | null;
  dueDate: Date | null;
  status: TaskStatus;
  priority: TaskPriority;
  isOverdue: boolean;
  refType: string;
  refId: string;
  createdAt: Date;
};

export type TaskCounts = {
  open: number;
  inProgress: number;
  overdue: number;
  today: number;
  thisWeek: number;
};

function toView(task: Task, nowMs = Date.now()): TaskView {
  return {
    id: task.id,
    type: task.type,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    status: task.status,
    priority: task.priority,
    isOverdue: computeIsOverdue(task.status, task.dueDate, nowMs),
    refType: task.refType,
    refId: task.refId,
    createdAt: task.createdAt,
  };
}

function startOfDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export const TaskService = {
  async listForUser(
    tenantId: string,
    userId: string,
    filter?: { status?: TaskStatus; includeCompleted?: boolean }
  ): Promise<TaskView[]> {
    const rows = await TaskRepo.listForUser(tenantId, userId, filter);
    const now = Date.now();
    return rows.map((r) => toView(r, now));
  },

  async getById(tenantId: string, id: string): Promise<TaskView> {
    const row = await TaskRepo.findById(tenantId, id);
    if (!row) throw new NotFoundError("Task", id);
    return toView(row);
  },

  async update(
    tenantId: string,
    userId: string,
    id: string,
    patch: {
      status?: TaskStatus;
      notes?: string | null;
      dueDate?: Date | null;
      priority?: TaskPriority;
    }
  ) {
    void userId;
    const updated = await TaskRepo.update(tenantId, id, patch);
    if (!updated) throw new NotFoundError("Task", id);
    return updated;
  },

  async countsForUser(tenantId: string, userId: string): Promise<TaskCounts> {
    const openRows = await TaskRepo.listForUser(tenantId, userId, {
      status: "OPEN",
    });
    const now = Date.now();
    const todayStart = startOfDay(new Date());
    const weekEnd = todayStart + 7 * 86_400_000;
    let overdue = 0;
    let today = 0;
    let thisWeek = 0;
    for (const t of openRows) {
      if (computeIsOverdue(t.status, t.dueDate, now)) overdue += 1;
      if (t.dueDate) {
        const d = t.dueDate.getTime();
        if (d >= todayStart && d < todayStart + 86_400_000) today += 1;
        if (d >= todayStart && d < weekEnd) thisWeek += 1;
      }
    }
    const byStatus = await TaskRepo.countsByStatus(tenantId, userId);
    return {
      open: byStatus.OPEN ?? openRows.length,
      inProgress: byStatus.IN_PROGRESS ?? 0,
      overdue,
      today,
      thisWeek,
    };
  },

  async overdueForTenant(tenantId: string): Promise<TaskView[]> {
    const rows = await TaskRepo.listOverdue(tenantId, new Date());
    const now = Date.now();
    return rows.map((r) => toView(r, now));
  },
};
