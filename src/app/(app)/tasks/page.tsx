import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { TaskService } from "@/modules/task/task.service";
import { TaskActionList } from "@/modules/task/components/TaskActionList";
import { NewTaskDialog } from "@/modules/task/components/NewTaskDialog";
import { PageHeader } from "@/components/ui/page-header";
import { RealtimeRefresher } from "@/components/realtime/RealtimeRefresher";
import { cn } from "cn";

type Props = {
  searchParams: Promise<{ tab?: string; error?: string }>;
};

const TABS = [
  { id: "active", label: "My tasks" },
  { id: "overdue", label: "Overdue" },
  { id: "completed", label: "Completed" },
] as const;

export default async function TasksPage({ searchParams }: Props) {
  const sp = await searchParams;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId || !session.user.id) {
    return <main className="p-8">Missing tenant</main>;
  }

  const tab =
    sp.tab === "overdue" || sp.tab === "completed" ? sp.tab : "active";

  const [openTasks, completedTasks, counts] = await withSessionScope(
    async (_scope) => {
      const open = await TaskService.listForUser(tenantId, session.user.id, {
        status: "OPEN",
      });
      const completed = await TaskService.listForUser(
        tenantId,
        session.user.id,
        { status: "COMPLETED", includeCompleted: true }
      );
      const c = await TaskService.countsForUser(tenantId, session.user.id);
      return [open, completed, c] as const;
    }
  );

  const overdueTasks = openTasks.filter((t) => t.isOverdue);
  const tasks =
    tab === "completed"
      ? completedTasks
      : tab === "overdue"
        ? overdueTasks
        : openTasks;

  return (
    <>
      <RealtimeRefresher eventTypes={["task.overdue", "candidate.status_changed"]} />
      <main className="mx-auto max-w-4xl space-y-6 p-6">
        <PageHeader
          title="Tasks"
          description="Daily recruitment workflow — system and manual tasks"
          actions={<NewTaskDialog />}
        />

        {sp.error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {sp.error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const count =
              t.id === "active"
                ? counts.open
                : t.id === "overdue"
                  ? counts.overdue
                  : completedTasks.length;
            const active = tab === t.id;
            return (
              <Link
                key={t.id}
                href={t.id === "active" ? "/tasks" : `/tasks?tab=${t.id}`}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                  t.id === "overdue" && !active && counts.overdue > 0
                    ? "text-destructive"
                    : null
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-xs tabular-nums",
                    active ? "bg-primary-foreground/20" : "bg-background/80",
                    t.id === "overdue" && counts.overdue > 0 && !active
                      ? "bg-destructive/15 text-destructive"
                      : null
                  )}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>

        <TaskActionList
          initialTasks={tasks}
          emptyMessage={
            tab === "overdue"
              ? "No overdue tasks."
              : tab === "completed"
                ? "No completed tasks yet."
                : "No open tasks. You're all caught up."
          }
        />
      </main>
    </>
  );
}
