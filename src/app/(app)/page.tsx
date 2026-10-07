import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { RequisitionService } from "@/modules/requisition/requisition.service";
import { TaskHome } from "@/modules/task/components/TaskHome";
import { TaskService } from "@/modules/task/task.service";

export default async function AppHome() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId || !session.user.id) {
    return <main className="p-8">Missing tenant</main>;
  }
  const userId = session.user.id;
  const [tasks, counts, requisitions] = await withTenant(tenantId, async () => {
    const t = await TaskService.listForUser(tenantId, userId, {
      status: "OPEN",
    });
    const c = await TaskService.countsForUser(tenantId, userId);
    const r = await RequisitionService.list(tenantId, { status: "OPEN" });
    return [t, c, r] as const;
  });
  const firstName =
    (session.user.name ?? "there").trim().split(/\s+/)[0] || "there";
  return (
    <main>
      <TaskHome
        firstName={firstName}
        tasks={tasks}
        counts={counts}
        requisitions={requisitions}
      />
    </main>
  );
}
