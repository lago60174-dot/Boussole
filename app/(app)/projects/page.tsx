import { createClient } from "@/lib/supabase/server";
import { ProjectsView } from "@/components/projects/ProjectsView";
import type { Project } from "@/lib/types/domain";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const [{ data: projects }, { data: tasks }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("tasks").select("project_id, status"),
  ]);

  const withProgress = ((projects as Project[]) ?? []).map((p) => {
    const projectTasks = (tasks ?? []).filter((t) => t.project_id === p.id);
    return {
      ...p,
      total: projectTasks.length,
      done: projectTasks.filter((t) => t.status === "done").length,
    };
  });

  return <ProjectsView projects={withProgress} />;
}
