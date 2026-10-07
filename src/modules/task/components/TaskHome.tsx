import Link from "next/link";
import type { RequisitionView } from "@/modules/requisition/requisition.service";
import type { TaskCounts, TaskView } from "@/modules/task/task.service";
import { TaskCountsRow } from "./TaskCountsRow";
import { TaskList } from "./TaskList";

type Props = {
  firstName: string;
  tasks: TaskView[];
  counts: TaskCounts;
  requisitions: RequisitionView[];
};

export function TaskHome({ firstName, tasks, counts, requisitions }: Props) {
  const dateLabel = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter((t) => t.status === "OPEN").slice(0, 20);
  return (
    <div className="mx-auto grid max-w-3xl gap-6 p-4 sm:p-8">
      <header>
        <h1 className="text-xl font-semibold">
          Good morning, {firstName}.
        </h1>
        <p className="text-sm text-neutral-500">{dateLabel}</p>
      </header>

      <TaskCountsRow counts={counts} />

      <section>
        <h2 className="mb-2 text-sm font-medium">Today&apos;s tasks</h2>
        <TaskList
          tasks={todayTasks}
          emptyMessage="You're all caught up."
        />
        {todayTasks.length === 0 ? (
          <Link href="/requisitions/new" className="mt-2 inline-block text-sm underline">
            Create a requisition
          </Link>
        ) : null}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium">Open requisitions</h2>
          <Link href="/requisitions?status=OPEN" className="text-xs underline">
            View all
          </Link>
        </div>
        {requisitions.length === 0 ? (
          <p className="text-sm text-neutral-500">No open requisitions.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-3">
            {requisitions.slice(0, 3).map((req) => (
              <li key={req.id} className="rounded border p-3 text-sm">
                <Link href={`/requisitions/${req.id}`} className="font-mono">
                  {req.reqCode}
                </Link>
                <p className="text-xs text-neutral-500">
                  {req.client.name} · SLA {req.slaFlag ?? "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
