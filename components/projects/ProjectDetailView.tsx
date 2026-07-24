"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { clsx } from "clsx";
import type { Project, Task, TaskDependency } from "@/lib/types/domain";
import { PROJECT_STATUS_LABELS } from "@/lib/types/domain";
import { KanbanBoard } from "./KanbanBoard";
import { GanttChart } from "./GanttChart";
import { ProjectFormModal } from "./ProjectFormModal";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { TaskRow } from "@/components/tasks/TaskRow";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/Badge";

type Tab = "kanban" | "gantt" | "list";
type ProjectOption = { id: string; name: string; color: string };

export function ProjectDetailView({
  project,
  tasks,
  dependencies,
}: {
  project: Project;
  tasks: Task[];
  dependencies: TaskDependency[];
}) {
  const [tab, setTab] = useState<Tab>("kanban");
  const [editingProject, setEditingProject] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);

  const projectOption: ProjectOption[] = [{ id: project.id, name: project.name, color: project.color }];
  const topLevel = tasks.filter((t) => !t.parent_task_id);
  const done = topLevel.filter((t) => t.status === "done").length;

  return (
    <div>
      <div className="mb-6">
        <div className="mb-2 flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">{project.name}</h1>
          </div>
          <button
            onClick={() => setEditingProject(true)}
            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-ink-soft hover:text-ink"
          >
            <Pencil size={12} /> Modifier
          </button>
        </div>
        {project.description && <p className="mb-3 max-w-2xl text-sm text-ink-soft">{project.description}</p>}
        <div className="flex items-center gap-3">
          <div className="w-40">
            <ProgressBar value={topLevel.length ? done / topLevel.length : 0} color={project.color} />
          </div>
          <span className="text-xs text-ink-soft">
            {done}/{topLevel.length} tâches · {PROJECT_STATUS_LABELS[project.status]}
          </span>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex overflow-hidden rounded-lg border border-line text-sm">
          {([
            ["kanban", "Kanban"],
            ["gantt", "Gantt"],
            ["list", "Liste"],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={clsx("px-3 py-1.5", tab === key ? "bg-projects-soft text-projects" : "text-ink-soft")}
            >
              {label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setCreatingTask(true)}>
          <Plus size={14} /> Nouvelle tâche
        </Button>
      </div>

      {tab === "list" && (
        <div className="mb-4">
          <QuickAddTask projectId={project.id} />
        </div>
      )}

      {tab === "kanban" && <KanbanBoard tasks={tasks} projectId={project.id} onEditTask={setEditingTask} />}
      {tab === "gantt" && (
        <GanttChart tasks={tasks} dependencies={dependencies} projectId={project.id} onEditTask={setEditingTask} />
      )}
      {tab === "list" && (
        <div className="flex flex-col gap-0.5 rounded-xl border border-line bg-canvas-raised p-2">
          {topLevel.length === 0 && <p className="px-3 py-6 text-center text-sm text-ink-soft">Aucune tâche.</p>}
          {topLevel.map((task) => (
            <TaskRow key={task.id} task={task} onEdit={setEditingTask} />
          ))}
        </div>
      )}

      <ProjectFormModal open={editingProject} onClose={() => setEditingProject(false)} project={project} />
      <TaskFormModal
        open={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        projects={projectOption}
        defaultProjectId={project.id}
      />
      <TaskFormModal
        open={creatingTask}
        onClose={() => setCreatingTask(false)}
        task={null}
        projects={projectOption}
        defaultProjectId={project.id}
      />
    </div>
  );
}
