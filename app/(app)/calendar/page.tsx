import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "@/components/calendar/CalendarView";
import type { CalendarEvent, Task } from "@/lib/types/domain";

export default async function CalendarPage() {
  const supabase = await createClient();

  const [{ data: events }, { data: tasks }] = await Promise.all([
    supabase.from("events").select("*").order("start_at"),
    supabase.from("tasks").select("*, project:projects(id,name,color)").not("due_date", "is", null),
  ]);

  return <CalendarView events={(events as CalendarEvent[]) ?? []} tasks={(tasks as Task[]) ?? []} />;
}
