"use client";

import { isPast, addHours, isBefore } from "date-fns";
import type { Task } from "@/lib/types/domain";
import { TaskRow } from "./TaskRow";

function isUrgent(task: Task): boolean {
  if (!task.due_date) return false;
  const due = new Date(task.due_date);
  return isPast(due) || isBefore(due, addHours(new Date(), 48));
}

function isImportant(task: Task): boolean {
  return task.priority === "high" || task.priority === "urgent";
}

const QUADRANTS = [
  {
    key: "do",
    title: "Faire",
    subtitle: "Urgent et important",
    accent: "var(--color-danger)",
    filter: (t: Task) => isUrgent(t) && isImportant(t),
  },
  {
    key: "schedule",
    title: "Planifier",
    subtitle: "Important, pas urgent",
    accent: "var(--color-compass)",
    filter: (t: Task) => !isUrgent(t) && isImportant(t),
  },
  {
    key: "delegate",
    title: "Déléguer",
    subtitle: "Urgent, pas important",
    accent: "var(--color-tasks)",
    filter: (t: Task) => isUrgent(t) && !isImportant(t),
  },
  {
    key: "eliminate",
    title: "Éliminer",
    subtitle: "Ni urgent ni important",
    accent: "var(--color-ink-soft)",
    filter: (t: Task) => !isUrgent(t) && !isImportant(t),
  },
] as const;

export function EisenhowerMatrix({
  tasks,
  onEdit,
}: {
  tasks: Task[];
  onEdit: (task: Task) => void;
}) {
  const open = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled" && !t.parent_task_id);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {QUADRANTS.map((q) => {
        const items = open.filter(q.filter);
        return (
          <div key={q.key} className="rounded-xl border border-line bg-canvas-raised p-3">
            <div className="mb-2 flex items-center gap-2 border-l-2 pl-2" style={{ borderColor: q.accent }}>
              <div>
                <p className="text-sm font-semibold text-ink">{q.title}</p>
                <p className="text-xs text-ink-soft">{q.subtitle}</p>
              </div>
              <span className="ml-auto text-xs text-ink-soft">{items.length}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {items.length === 0 && <p className="px-2 py-3 text-xs text-ink-soft">Rien ici.</p>}
              {items.map((task) => (
                <TaskRow key={task.id} task={task} onEdit={onEdit} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
