import { differenceInCalendarDays } from "date-fns";
import { db } from "@/core/db/client";
import type { ApplicationStatus } from "@prisma/client";
import {
  RequisitionService,
  type RequisitionView,
} from "@/modules/requisition/requisition.service";
import { TaskService, type TaskView } from "@/modules/task/task.service";

export type DashboardKpis = {
  activeReqs: number;
  activeReqsThisWeek: number;
  pipelineCount: number;
  inScreening: number;
  pendingTasks: number;
  overdueTasks: number;
  complianceAlerts: number;
  docsExpiring: number;
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

export type UrgentRequisitionRow = RequisitionView & {
  slaDays: number | null;
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

function slaDaysRemaining(target: Date | null): number | null {
  if (!target) return null;
  return differenceInCalendarDays(target, new Date());
}

function humanActivity(row: {
  entity: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
}): string {
  const field = row.field ? ` · ${row.field}` : "";
  if (row.oldValue || row.newValue) {
    return `${row.entity}${field}: ${row.oldValue ?? "—"} → ${row.newValue ?? "—"}`;
  }
  return `${row.entity}${field || " updated"}`;
}

export const DashboardService = {
  async getKpis(tenantId: string, userId: string): Promise<DashboardKpis> {
    const since = weekAgo();
    const until30 = new Date(Date.now() + 30 * 86_400_000);

    const [
      activeReqs,
      activeReqsThisWeek,
      pipelineCount,
      inScreening,
      openTasks,
      docsExpiring,
      pendingDocs,
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
          status: {
            notIn: [
              "REJECTED",
              "MOBILIZED",
              "CONFIRMED",
              "MEDICAL_UNFIT",
              "VISA_REFUSED",
            ],
          },
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
      db.document.count({
        where: {
          tenantId,
          deletedAt: null,
          confirmed: true,
          expiryDate: { not: null, lte: until30 },
        },
      }),
      db.document.count({
        where: { tenantId, deletedAt: null, confirmed: false },
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
      docsExpiring,
      complianceAlerts: docsExpiring + pendingDocs,
    };
  },

  async getPipeline(tenantId: string): Promise<PipelineStage[]> {
    const grouped = await db.candidateApplication.groupBy({
      by: ["status"],
      where: {
        tenantId,
        deletedAt: null,
        status: { notIn: ["REJECTED", "MEDICAL_UNFIT", "VISA_REFUSED"] },
      },
      _count: { _all: true },
    });
    const map = new Map(grouped.map((g) => [g.status, g._count._all]));
    return PIPELINE_ORDER.map((s) => ({
      status: s.status,
      label: s.label,
      count: map.get(s.status) ?? 0,
    }));
  },

  async getUrgentRequisitions(tenantId: string): Promise<UrgentRequisitionRow[]> {
    const list = await RequisitionService.list(tenantId, { status: "OPEN" });
    return list
      .slice()
      .sort((a, b) => {
        const ad = a.targetOnboardingDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bd = b.targetOnboardingDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
        if (ad !== bd) return ad - bd;
        const rank = (f: RequisitionView["slaFlag"]) =>
          f === "RED" ? 0 : f === "AMBER" ? 1 : f === "GREEN" ? 2 : 3;
        return rank(a.slaFlag) - rank(b.slaFlag);
      })
      .slice(0, 5)
      .map((req) => ({
        ...req,
        slaDays: slaDaysRemaining(req.targetOnboardingDate),
      }));
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
    return rows.map((r) => ({
      id: r.id,
      summary: humanActivity(r).slice(0, 140),
      createdAt: r.createdAt,
      entity: r.entity,
      entityId: r.entityId,
    }));
  },
};
