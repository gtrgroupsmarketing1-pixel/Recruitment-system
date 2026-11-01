import { NextResponse } from "next/server";
import {
  MobileAuthError,
  withMobileScope,
} from "@/core/mobile-auth/with-mobile-scope";
import { DashboardService } from "@/modules/dashboard/dashboard.service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const data = await withMobileScope(req, async (scope, user) => {
      const [kpis, pipeline, urgent, tasks, activity] = await Promise.all([
        DashboardService.getKpis(scope.tenantId, scope.userId),
        DashboardService.getPipeline(scope.tenantId),
        DashboardService.getUrgentRequisitions(scope.tenantId),
        DashboardService.getTodayTasks(scope.tenantId, scope.userId),
        DashboardService.getRecentActivity(scope.tenantId),
      ]);
      return {
        user: {
          id: user.sub,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        },
        kpis,
        pipeline,
        urgentRequisitions: urgent.map((r) => ({
          id: r.id,
          reqCode: r.reqCode,
          clientName: r.client.name,
          daysLeft: r.slaDays ?? null,
        })),
        todayTasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          isOverdue: t.isOverdue,
        })),
        activity: activity.map((a) => ({
          id: a.id,
          summary: a.summary,
          createdAt: a.createdAt,
        })),
      };
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[mobile/dashboard]", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
