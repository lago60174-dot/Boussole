import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";
import type { Project, Task, TaskDependency } from "@/lib/types/domain";

function buildTaskTree(flat: Task[]): Task[] {
  const byId = new Map(flat.map((t) => [t.id, { ...t, subtasks: [] as Task[] }]));
  const roots: Task[] = [];
  for (const task of byId.values()) {
    if (task.parent_task_id && byId.has(task.parent_task_id)) {
      byId.get(task.parent_task_id)!.subtasks!.push(task);
    } else {
      roots.push(task);
    }
  }
  return roots;
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: project }, { data: tasks }, { data: dependencies }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase
      .from("tasks")
      .select("*, project:projects(id,name,color)")
      .eq("project_id", id)
      .order("position"),
    supabase.from("task_dependencies").select("*").eq("user_id", user?.id ?? ""),
  ]);

  if (!project) notFound();

  const flatTasks = (tasks as Task[]) ?? [];
  const taskIds = new Set(flatTasks.map((t) => t.id));
  const relevantDeps = ((dependencies as TaskDependency[]) ?? []).filter(
    (d) => taskIds.has(d.task_id) && taskIds.has(d.depends_on_task_id)
  );

  return (
    <ProjectDetailView
      project={project as Project}
      tasks={buildTaskTree(flatTasks)}
      dependencies={relevantDeps}
    />
  );
}
