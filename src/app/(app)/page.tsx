import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { DashboardService } from "@/modules/dashboard/dashboard.service";
import { DashboardHome } from "@/modules/dashboard/components/DashboardHome";
import { RealtimeRefresher } from "@/components/realtime/RealtimeRefresher";

export default async function AppHome() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId || !session.user.id) {
    return <main className="p-8">Missing tenant</main>;
  }
  const userId = session.user.id;

  const data = await withSessionScope(async () => {
    const [kpis, pipeline, urgentReqs, tasks, activity] = await Promise.all([
      DashboardService.getKpis(tenantId, userId),
      DashboardService.getPipeline(tenantId),
      DashboardService.getUrgentRequisitions(tenantId),
      DashboardService.getTodayTasks(tenantId, userId),
      DashboardService.getRecentActivity(tenantId),
    ]);
    return { kpis, pipeline, urgentReqs, tasks, activity };
  });

  const firstName =
    (session.user.name ?? "there").trim().split(/\s+/)[0] || "there";

  return (
    <>
      <RealtimeRefresher
        eventTypes={["candidate.status_changed", "task.overdue"]}
      />
      <DashboardHome
        firstName={firstName}
        kpis={data.kpis}
        pipeline={data.pipeline}
        urgentReqs={data.urgentReqs}
        tasks={data.tasks}
        activity={data.activity}
      />
    </>
  );
}
