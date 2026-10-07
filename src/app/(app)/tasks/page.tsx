import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { TaskList } from "@/modules/task/components/TaskList";
import { TaskService } from "@/modules/task/task.service";

type Props = {
  searchParams: Promise<{ status?: string }>;
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
  const tasks = await withTenant(tenantId, () =>
    TaskService.listForUser(tenantId, session.user.id, {
      status,
      includeCompleted: status === "COMPLETED",
    })
  );
  return (
    <main className="mx-auto grid max-w-3xl gap-4 p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tasks</h1>
        <Link href="/" className="text-sm underline">
          Home
        </Link>
      </div>
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
