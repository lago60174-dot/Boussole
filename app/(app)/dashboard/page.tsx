import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { expandOccurrences } from "@/lib/utils/recurrence";
import { todayBoundsInTimezone } from "@/lib/utils/dates";
import type { Task, CalendarEvent, Objective, KeyResult, Project } from "@/lib/types/domain";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, timezone")
    .eq("id", user?.id ?? "")
    .single();

  const now = new Date();
  const { start: todayStart, end: todayEnd } = todayBoundsInTimezone(profile?.timezone ?? "Europe/Paris", now);

  const [
    { data: tasks },
    { data: events },
    { data: objectives },
    { data: keyResults },
    { data: projects },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, project:projects(id,name,color)")
      .not("status", "in", "(done,cancelled)")
      .lte("due_date", todayEnd)
      .order("due_date"),
    supabase.from("events").select("*"),
    supabase
      .from("objectives")
      .select("*, project:projects(id,name,color)")
      .neq("status", "completed")
      .order("created_at", { ascending: false }),
    supabase.from("key_results").select("*"),
    supabase.from("projects").select("*").eq("status", "active").order("created_at", { ascending: false }),
  ]);

  const allTasks = (tasks as Task[]) ?? [];
  const tasksToday = allTasks.filter((t) => t.due_date && t.due_date <= todayEnd);
  const overdueCount = tasksToday.filter((t) => t.due_date! < todayStart).length;

  const eventsTodayList: CalendarEvent[] = [];
  for (const event of (events as CalendarEvent[]) ?? []) {
    const occs = expandOccurrences(new Date(event.start_at), event.recurrence_rule, new Date(todayStart), new Date(todayEnd));
    if (occs.length > 0) eventsTodayList.push(event);
  }

  const objectivesWithKr: Objective[] = ((objectives as Objective[]) ?? []).map((o) => ({
    ...o,
    key_results: ((keyResults as KeyResult[]) ?? []).filter((kr) => kr.objective_id === o.id),
  }));

  return (
    <DashboardView
      displayName={profile?.display_name || "👋"}
      tasksToday={tasksToday}
      overdueCount={overdueCount}
      eventsToday={eventsTodayList}
      objectives={objectivesWithKr}
      projects={(projects as Project[]) ?? []}
      projectOptions={((projects as Project[]) ?? []).map((p) => ({ id: p.id, name: p.name, color: p.color }))}
    />
  );
}
