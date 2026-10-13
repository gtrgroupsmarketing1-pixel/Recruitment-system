import Link from "next/link";
import type { RequisitionView } from "@/modules/requisition/requisition.service";
import type { TaskCounts, TaskView } from "@/modules/task/task.service";
import { TaskCountsRow } from "./TaskCountsRow";
import { TaskList } from "./TaskList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  firstName: string;
  tasks: TaskView[];
  counts: TaskCounts;
  requisitions: RequisitionView[];
};

export function TaskHome({ firstName, tasks, counts, requisitions }: Props) {
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const todayTasks = tasks.filter((t) => t.status === "OPEN").slice(0, 20);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 sm:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Good morning, {firstName}.
          </h1>
          <p className="text-sm text-muted-foreground">{dateLabel}</p>
        </div>
        <Link
          href="/requisitions/new"
          className={cn(buttonVariants())}
        >
          New requisition
        </Link>
      </header>

      <TaskCountsRow counts={counts} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-medium">
            Today&apos;s tasks
          </CardTitle>
          <Link
            href="/tasks"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {todayTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-8 text-center">
              <p className="text-sm font-medium">You&apos;re all caught up</p>
              <p className="text-xs text-muted-foreground">
                No open tasks assigned to you right now.
              </p>
            </div>
          ) : (
            <TaskList tasks={todayTasks} emptyMessage="You're all caught up." />
          )}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">Open requisitions</h2>
          <Link
            href="/requisitions?status=OPEN"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            View all
          </Link>
        </div>
        {requisitions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No open requisitions.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {requisitions.slice(0, 3).map((req) => (
              <Card
                key={req.id}
                className="transition-colors hover:border-primary/40"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="font-mono text-sm">
                    <Link
                      href={`/requisitions/${req.id}`}
                      className="hover:underline"
                    >
                      {req.reqCode}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {req.client.name}
                  </p>
                  {req.slaFlag ? (
                    <Badge
                      variant={
                        req.slaFlag === "RED"
                          ? "destructive"
                          : req.slaFlag === "AMBER"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      SLA {req.slaFlag}
                    </Badge>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}