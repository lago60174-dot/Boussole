import { createClient } from "@/lib/supabase/server";
import { ObjectivesView } from "@/components/objectives/ObjectivesView";
import type { Objective, KeyResult } from "@/lib/types/domain";

export default async function ObjectivesPage() {
  const supabase = await createClient();

  const [{ data: objectives }, { data: keyResults }, { data: projects }] = await Promise.all([
    supabase
      .from("objectives")
      .select("*, project:projects(id,name,color)")
      .order("created_at", { ascending: false }),
    supabase.from("key_results").select("*"),
    supabase.from("projects").select("id,name").order("name"),
  ]);

  const withKeyResults: Objective[] = ((objectives as Objective[]) ?? []).map((o) => ({
    ...o,
    key_results: ((keyResults as KeyResult[]) ?? []).filter((kr) => kr.objective_id === o.id),
  }));

  return <ObjectivesView objectives={withKeyResults} projects={projects ?? []} />;
}
