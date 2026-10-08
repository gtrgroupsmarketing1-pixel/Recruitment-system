import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { OverdueBadge } from "@/modules/task/components/OverdueBadge";
import { TaskService } from "@/modules/task/task.service";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return <main className="p-8">Missing tenant</main>;
  const task = await withSessionScope((_scope) =>
    TaskService.getById(tenantId, id)
  );
  return (
    <main className="mx-auto max-w-xl p-4 sm:p-8">
      <Link href="/tasks" className="text-sm underline">
        Back to tasks
      </Link>
      <h1 className="mt-4 text-xl font-semibold">{task.title}</h1>
      <p className="mt-2 text-sm">
        {task.priority} · {task.status} ·{" "}
        <OverdueBadge isOverdue={task.isOverdue} />
      </p>
      <p className="mt-2 text-sm text-neutral-600">
        {task.description ?? "No description."}
      </p>
      <p className="mt-2 text-xs text-neutral-500">
        Due: {task.dueDate ? task.dueDate.toISOString().slice(0, 10) : "—"}
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        Ref: {task.refType}/{task.refId}
      </p>
    </main>
  );
}
