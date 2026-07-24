"use client";

import { useEffect, useState, useTransition } from "react";
import { clsx } from "clsx";
import type { Task, TaskStatus } from "@/lib/types/domain";
import { reorderTasks } from "@/lib/actions/tasks";
import { relativeDueLabel } from "@/lib/utils/dates";
import { Clock } from "lucide-react";

const COLUMNS: { status: TaskStatus; label: string; accent: string }[] = [
  { status: "todo", label: "À faire", accent: "var(--color-ink-soft)" },
  { status: "in_progress", label: "En cours", accent: "var(--color-compass)" },
  { status: "done", label: "Terminé", accent: "var(--color-success)" },
];

export function KanbanBoard({
  tasks,
  projectId,
  onEditTask,
}: {
  tasks: Task[];
  projectId: string;
  onEditTask: (task: Task) => void;
}) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [, startTransition] = useTransition();

  // Resynchronise l'état local optimiste dès que le parent (Server Component)
  // repasse des tâches à jour, par ex. après une édition via la modale ou
  // une création — sinon le Kanban restait figé sur son état initial tant
  // qu'on ne changeait pas d'onglet.
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const rows = localTasks.filter((t) => !t.parent_task_id && t.status !== "cancelled");

  function handleDrop(status: TaskStatus, taskId: string) {
    setLocalTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    setDragOverCol(null);

    const columnTasks = rows.filter((t) => t.status === status && t.id !== taskId);
    const updates = [{ id: taskId, status, position: columnTasks.length }];
    startTransition(() => {
      reorderTasks(updates, projectId);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {COLUMNS.map((col) => {
        const items = rows.filter((t) => t.status === col.status);
        return (
          <div
            key={col.status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(col.status);
            }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData("text/task-id");
              if (taskId) handleDrop(col.status, taskId);
            }}
            className={clsx(
              "flex min-h-40 flex-col gap-2 rounded-xl border border-line bg-canvas-raised p-3 transition-colors",
              dragOverCol === col.status && "border-compass bg-compass-soft/40"
            )}
          >
            <div className="mb-1 flex items-center gap-2 border-l-2 pl-2" style={{ borderColor: col.accent }}>
              <p className="text-sm font-semibold text-ink">{col.label}</p>
              <span className="ml-auto text-xs text-ink-soft">{items.length}</span>
            </div>

            {items.map((task) => {
              const due = task.due_date ? relativeDueLabel(task.due_date) : null;
              return (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/task-id", task.id)}
                  onClick={() => onEditTask(task)}
                  className="cursor-grab rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink shadow-sm active:cursor-grabbing"
                >
                  <p className="mb-1">{task.title}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {task.priority !== "medium" && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            task.priority === "urgent"
                              ? "var(--color-danger)"
                              : task.priority === "high"
                                ? "var(--color-tasks)"
                                : "var(--color-ink-soft)",
                        }}
                      />
                    )}
                    {due && (
                      <span className={clsx("flex items-center gap-1 text-xs", due.overdue ? "text-danger" : "text-ink-soft")}>
                        <Clock size={10} /> {due.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {items.length === 0 && <p className="px-1 py-3 text-xs text-ink-soft">Glisse une tâche ici.</p>}
          </div>
        );
      })}
    </div>
  );
}
