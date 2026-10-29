import { db } from "@/core/db/client";
import type { ApplicationStatus } from "@prisma/client";
import { RequisitionService, type RequisitionView } from "@/modules/requisition/requisition.service";
import { TaskService, type TaskView } from "@/modules/task/task.service";

export type DashboardKpis = {
  activeReqs: number;
  activeReqsThisWeek: number;
  pipelineCount: number;
  inScreening: number;
  pendingTasks: number;
  overdueTasks: number;
  complianceAlerts: number;
};

export type PipelineStage = {
  status: ApplicationStatus;
  label: string;
  count: number;
};

export type ActivityItem = {
  id: string;
  summary: string;
  createdAt: Date;
  entity: string;
  entityId: string;
};

const PIPELINE_ORDER: { status: ApplicationStatus; label: string }[] = [
  { status: "SOURCED", label: "Sourced" },
  { status: "SCREENED", label: "Screened" },
  { status: "SHORTLISTED", label: "Shortlisted" },
  { status: "SELECTED", label: "Selected" },
  { status: "MOBILIZED", label: "Deployed" },
];

function weekAgo(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 7);
  return d;
}

export const DashboardService = {
  async getKpis(tenantId: string, userId: string): Promise<DashboardKpis> {
    const since = weekAgo();
    const now = new Date();

    const [
      activeReqs,
      activeReqsThisWeek,
      pipelineCount,
      inScreening,
      openTasks,
      complianceAlerts,
    ] = await Promise.all([
      db.jobRequisition.count({
        where: { tenantId, status: "OPEN", deletedAt: null },
      }),
      db.jobRequisition.count({
        where: {
          tenantId,
          status: "OPEN",
          deletedAt: null,
          createdAt: { gte: since },
        },
      }),
      db.candidateApplication.count({
        where: {
          tenantId,
          deletedAt: null,
          status: { notIn: ["REJECTED", "MOBILIZED", "CONFIRMED", "MEDICAL_UNFIT", "VISA_REFUSED"] },
        },
      }),
      db.candidateApplication.count({
        where: {
          tenantId,
          deletedAt: null,
          status: { in: ["SOURCED", "SCREENED"] },
        },
      }),
      TaskService.listForUser(tenantId, userId, { status: "OPEN" }),
      db.complianceCase.count({
        where: {
          tenantId,
          deletedAt: null,
          status: { in: ["PENDING", "IN_PROGRESS", "BLOCKED"] },
        },
      }),
    ]);

    const overdueTasks = openTasks.filter((t) => t.isOverdue).length;

    return {
      activeReqs,
      activeReqsThisWeek,
      pipelineCount,
      inScreening,
      pendingTasks: openTasks.length,
      overdueTasks,
      complianceAlerts,
    };
  },

  async getPipeline(tenantId: string): Promise<PipelineStage[]> {
    const grouped = await db.candidateApplication.groupBy({
      by: ["status"],
      where: { tenantId, deletedAt: null },
      _count: { _all: true },
    });
    const map = new Map(grouped.map((g) => [g.status, g._count._all]));
    return PIPELINE_ORDER.map((s) => ({
      status: s.status,
      label: s.label,
      count: map.get(s.status) ?? 0,
    }));
  },

  async getUrgentRequisitions(tenantId: string): Promise<RequisitionView[]> {
    const list = await RequisitionService.list(tenantId, { status: "OPEN" });
    return list
      .slice()
      .sort((a, b) => {
        const rank = (f: RequisitionView["slaFlag"]) =>
          f === "RED" ? 0 : f === "AMBER" ? 1 : f === "GREEN" ? 2 : 3;
        const bySla = rank(a.slaFlag) - rank(b.slaFlag);
        if (bySla !== 0) return bySla;
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .slice(0, 5);
  },

  async getTodayTasks(tenantId: string, userId: string): Promise<TaskView[]> {
    const tasks = await TaskService.listForUser(tenantId, userId, {
      status: "OPEN",
    });
    return tasks.slice(0, 12);
  },

  async getRecentActivity(tenantId: string): Promise<ActivityItem[]> {
    const rows = await db.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        entity: true,
        entityId: true,
        field: true,
        oldValue: true,
        newValue: true,
        createdAt: true,
      },
    });
    return rows.map((r) => {
      const field = r.field ? ` ${r.field}` : "";
      const change =
        r.oldValue || r.newValue
          ? `: ${r.oldValue ?? "—"} → ${r.newValue ?? "—"}`
          : "";
      return {
        id: r.id,
        summary: `${r.entity}${field}${change}`.slice(0, 120),
        createdAt: r.createdAt,
        entity: r.entity,
        entityId: r.entityId,
      };
    });
  },
};
