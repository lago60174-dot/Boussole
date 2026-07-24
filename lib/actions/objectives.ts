"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ObjectiveStatus, MetricType } from "@/lib/types/domain";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");
  return { supabase, user };
}

function revalidateObjectiveViews() {
  revalidatePath("/objectives");
  revalidatePath("/dashboard");
}

export type ObjectiveInput = {
  title: string;
  description?: string | null;
  project_id?: string | null;
  status?: ObjectiveStatus;
  period_start?: string | null;
  period_end?: string | null;
};

export async function createObjective(input: ObjectiveInput) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("objectives")
    .insert({ user_id: user.id, ...input })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidateObjectiveViews();
  return { error: null, id: data.id };
}

export async function updateObjective(id: string, input: Partial<ObjectiveInput>) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("objectives").update(input).eq("id", id);
  if (error) return { error: error.message };
  revalidateObjectiveViews();
  return { error: null };
}

export async function deleteObjective(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("objectives").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateObjectiveViews();
  return { error: null };
}

export type KeyResultInput = {
  objective_id: string;
  title: string;
  metric_type?: MetricType;
  start_value?: number;
  target_value?: number;
  current_value?: number;
  unit?: string | null;
};

export async function createKeyResult(input: KeyResultInput) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("key_results").insert({ user_id: user.id, ...input });
  if (error) return { error: error.message };
  revalidateObjectiveViews();
  return { error: null };
}

export async function updateKeyResultProgress(id: string, current_value: number) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("key_results").update({ current_value }).eq("id", id);
  if (error) return { error: error.message };
  revalidateObjectiveViews();
  return { error: null };
}

export async function updateKeyResult(id: string, input: Partial<KeyResultInput>) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("key_results").update(input).eq("id", id);
  if (error) return { error: error.message };
  revalidateObjectiveViews();
  return { error: null };
}

export async function deleteKeyResult(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("key_results").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateObjectiveViews();
  return { error: null };
}
