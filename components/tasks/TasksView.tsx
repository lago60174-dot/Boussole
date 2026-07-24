"use client";

import { useMemo, useState } from "react";
import { isPast, isToday } from "date-fns";
import { clsx } from "clsx";
import { Plus } from "lucide-react";
import type { Task } from "@/lib/types/domain";
import { TaskRow } from "./TaskRow";
import { QuickAddTask } from "./QuickAddTask";
import { TaskFormModal } from "./TaskFormModal";
import { EisenhowerMatrix } from "./EisenhowerMatrix";
import { Button } from "@/components/ui/Button";

type ProjectOption = { id: string; name: string; color: string };
type Filter = "today" | "upcoming" | "overdue" | "all" | "done";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "today", label: "Aujourd'hui" },
  { key: "upcoming", label: "À venir" },
  { key: "overdue", label: "En retard" },
  { key: "all", label: "Toutes" },
  { key: "done", label: "Terminées" },
];

export function TasksView({ tasks, projects }: { tasks: Task[]; projects: ProjectOption[] }) {
  const [filter, setFilter] = useState<Filter>("today");
  const [view, setView] = useState<"list" | "matrix">("list");
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);

  const topLevel = useMemo(() => tasks.filter((t) => !t.parent_task_id), [tasks]);

  const filtered = useMemo(() => {
    return topLevel.filter((t) => {
      if (filter === "done") return t.status === "done";
      if (t.status === "done" || t.status === "cancelled") return false;
      if (filter === "all") return true;
      if (!t.due_date) return false;
      const due = new Date(t.due_date);
      if (filter === "today") return isToday(due) || isPast(due);
      if (filter === "overdue") return isPast(due) && !isToday(due);
      if (filter === "upcoming") return !isPast(due) && !isToday(due);
      return true;
    });
  }, [topLevel, filter]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">Tâches</h1>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-line text-sm">
            <button
              onClick={() => setView("list")}
              className={clsx("px-3 py-1.5", view === "list" ? "bg-tasks-soft text-tasks" : "text-ink-soft")}
            >
              Liste
            </button>
            <button
              onClick={() => setView("matrix")}
              className={clsx("px-3 py-1.5", view === "matrix" ? "bg-tasks-soft text-tasks" : "text-ink-soft")}
            >
              Matrice
            </button>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus size={14} /> Nouvelle tâche
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <QuickAddTask />
      </div>

      {view === "list" && (
        <>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  filter === f.key ? "bg-ink text-canvas" : "bg-line/60 text-ink-soft hover:bg-line"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-0.5 rounded-xl border border-line bg-canvas-raised p-2">
            {filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-ink-soft">Rien à afficher ici. 🎉</p>
            )}
            {filtered.map((task) => (
              <TaskRow key={task.id} task={task} onEdit={setEditing} />
            ))}
          </div>
        </>
      )}

      {view === "matrix" && <EisenhowerMatrix tasks={topLevel} onEdit={setEditing} />}

      <TaskFormModal
        open={creating}
        onClose={() => setCreating(false)}
        task={null}
        projects={projects}
      />
      <TaskFormModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        task={editing}
        projects={projects}
      />
    </div>
  );
}
