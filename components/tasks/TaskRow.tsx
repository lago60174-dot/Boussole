"use client";

import { useState, useTransition } from "react";
import { ChevronRight, ChevronDown, Clock, Repeat, Plus } from "lucide-react";
import { clsx } from "clsx";
import type { Task } from "@/lib/types/domain";
import { PRIORITY_LABELS } from "@/lib/types/domain";
import { toggleTaskDone, deleteTask, createTask } from "@/lib/actions/tasks";
import { relativeDueLabel } from "@/lib/utils/dates";
import { Badge } from "@/components/ui/Badge";

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "var(--color-danger)",
  high: "var(--color-tasks)",
  medium: "var(--color-compass)",
  low: "var(--color-ink-soft)",
};

export function TaskRow({
  task,
  onEdit,
  depth = 0,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [pending, startTransition] = useTransition();
  const done = task.status === "done";
  const hasSubtasks = (task.subtasks?.length ?? 0) > 0;
  const due = task.due_date ? relativeDueLabel(task.due_date) : null;

  function handleToggle() {
    startTransition(async () => {
      await toggleTaskDone(task.id);
    });
  }

  function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;
    startTransition(async () => {
      await createTask({ title: subtaskTitle.trim(), parent_task_id: task.id, project_id: task.project_id });
      setSubtaskTitle("");
      setAddingSubtask(false);
    });
  }

  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div
        className={clsx(
          "group flex items-start gap-3 rounded-lg border border-transparent px-2 py-2.5 hover:border-line hover:bg-canvas-raised",
          pending && "opacity-60"
        )}
      >
        {hasSubtasks ? (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-0.5 text-ink-soft hover:text-ink"
            aria-label="Déplier les sous-tâches"
          >
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        ) : (
          <span className="w-[15px]" />
        )}

        <button
          onClick={handleToggle}
          disabled={pending}
          aria-label={done ? "Marquer à faire" : "Marquer terminée"}
          className={clsx(
            "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            done ? "border-success bg-success" : "border-ink-soft/50 hover:border-compass"
          )}
        >
          {done && <span className="h-[7px] w-[7px] rounded-full bg-white" />}
        </button>

        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onEdit(task)}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={clsx("text-sm", done ? "text-ink-soft line-through" : "text-ink")}>
              {task.title}
            </span>
            {task.recurrence_rule && <Repeat size={12} className="text-ink-soft" />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {task.priority !== "medium" && (
              <Badge color={PRIORITY_COLOR[task.priority]} soft="transparent" className="!px-0 !py-0 font-semibold">
                {PRIORITY_LABELS[task.priority]}
              </Badge>
            )}
            {due && (
              <span
                className={clsx(
                  "inline-flex items-center gap-1 text-xs",
                  due.overdue ? "font-medium text-danger" : "text-ink-soft"
                )}
              >
                <Clock size={11} /> {due.label}
              </span>
            )}
            {task.project && (
              <Badge color={task.project.color} soft={task.project.color + "22"}>
                {task.project.name}
              </Badge>
            )}
            {task.tags.map((tag) => (
              <span key={tag} className="text-xs text-ink-soft">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setAddingSubtask((v) => !v)}
            className="rounded p-1 text-ink-soft hover:bg-line hover:text-ink"
            aria-label="Ajouter une sous-tâche"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => startTransition(async () => { await deleteTask(task.id); })}
            className="rounded px-1.5 py-0.5 text-xs text-ink-soft hover:bg-danger/10 hover:text-danger"
          >
            Suppr.
          </button>
        </div>
      </div>

      {addingSubtask && (
        <form onSubmit={handleAddSubtask} className="ml-9 flex gap-2 py-1" style={{ marginLeft: depth * 20 + 36 }}>
          <input
            autoFocus
            value={subtaskTitle}
            onChange={(e) => setSubtaskTitle(e.target.value)}
            onBlur={() => !subtaskTitle && setAddingSubtask(false)}
            placeholder="Nouvelle sous-tâche…"
            className="w-full rounded-md border border-line bg-canvas-raised px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-compass/40"
          />
        </form>
      )}

      {expanded && hasSubtasks && (
        <div className="border-l border-line pl-1">
          {task.subtasks!.map((sub) => (
            <TaskRow key={sub.id} task={sub} onEdit={onEdit} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
