"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");
  return { supabase, user };
}

function revalidateEventViews() {
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export type EventInput = {
  title: string;
  description?: string | null;
  location?: string | null;
  start_at: string;
  end_at: string;
  all_day?: boolean;
  recurrence_rule?: string | null;
  color?: string;
  project_id?: string | null;
  linked_task_id?: string | null;
  reminder_minutes_before?: number | null;
};

export async function createEvent(input: EventInput) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("events")
    .insert({ user_id: user.id, ...input })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidateEventViews();
  return { error: null, id: data.id };
}

export async function updateEvent(id: string, input: Partial<EventInput>) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("events").update(input).eq("id", id);
  if (error) return { error: error.message };
  revalidateEventViews();
  return { error: null };
}

export async function deleteEvent(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateEventViews();
  return { error: null };
}
