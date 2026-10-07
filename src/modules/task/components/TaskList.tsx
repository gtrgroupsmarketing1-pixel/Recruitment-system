import type { TaskView } from "@/modules/task/task.service";
import { TaskRow } from "./TaskRow";

type Props = { tasks: TaskView[]; emptyMessage?: string };

export function TaskList({ tasks, emptyMessage }: Props) {
  if (tasks.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        {emptyMessage ?? "No tasks."}
      </p>
    );
  }
  return (
    <ul className="divide-y">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </ul>
  );
}
