import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { TaskList } from "@/modules/task/components/TaskList";
import { TaskService } from "@/modules/task/task.service";
import { createTaskAction } from "@/modules/task/create.action";
import { PageHeader } from "@/components/ui/page-header";

type Props = {
  searchParams: Promise<{ status?: string; error?: string }>;
};

export default async function TasksPage({ searchParams }: Props) {
  const sp = await searchParams;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId || !session.user.id) {
    return <main className="p-8">Missing tenant</main>;
  }
  const status =
    sp.status === "OPEN" ||
    sp.status === "IN_PROGRESS" ||
    sp.status === "COMPLETED" ||
    sp.status === "OVERDUE" ||
    sp.status === "CANCELLED"
      ? sp.status
      : undefined;
  const tasks = await withSessionScope((_scope) =>
    TaskService.listForUser(tenantId, session.user.id, {
      status,
      includeCompleted: status === "COMPLETED",
    })
  );
  return (
    <main className="mx-auto grid max-w-3xl gap-6 p-4 sm:p-8">
      <PageHeader
        title="Tasks"
        description="Your open work items. System tasks are created from pipeline events; you can also add manual tasks."
        actions={
          <Link href="/" className="text-sm underline underline-offset-2">
            Home
          </Link>
        }
      />

      {sp.error ? (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {sp.error}
        </p>
      ) : null}

      <form
        action={createTaskAction}
        className="grid gap-2 rounded-lg border p-4 sm:grid-cols-2"
      >
        <p className="sm:col-span-2 text-sm font-medium">New task</p>
        <label className="grid gap-1 text-sm sm:col-span-2">
          Title
          <input
            name="title"
            required
            placeholder="e.g. Call candidate about medical"
            className="rounded border px-2 py-1.5"
          />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          Description
          <input name="description" className="rounded border px-2 py-1.5" />
        </label>
        <label className="grid gap-1 text-sm">
          Due date
          <input name="dueDate" type="date" className="rounded border px-2 py-1.5" />
        </label>
        <label className="grid gap-1 text-sm">
          Priority
          <select name="priority" defaultValue="MEDIUM" className="rounded border px-2 py-1.5">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-sm text-white">
            Add task
          </button>
        </div>
      </form>

      <form method="get" className="flex gap-2 text-sm">
        <select name="status" defaultValue={status ?? ""} className="rounded border px-2 py-1">
          <option value="">Active</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="OVERDUE">OVERDUE</option>
        </select>
        <button type="submit" className="rounded bg-black px-3 py-1 text-white">
          Filter
        </button>
      </form>
      <TaskList tasks={tasks} />
    </main>
  );
}
