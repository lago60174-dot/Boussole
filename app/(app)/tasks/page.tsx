import { createClient } from "@/lib/supabase/server";
import { TasksView } from "@/components/tasks/TasksView";
import type { Task } from "@/lib/types/domain";

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

export default async function TasksPage() {
  const supabase = await createClient();

  const [{ data: tasks }, { data: projects }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, project:projects(id,name,color)")
      .order("position", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("id,name,color").order("name"),
  ]);

  const tree = buildTaskTree((tasks as Task[]) ?? []);

  return <TasksView tasks={tree} projects={projects ?? []} />;
}
