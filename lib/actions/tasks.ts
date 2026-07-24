"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getNextOccurrence } from "@/lib/utils/recurrence";
import { parseFlexibleDate } from "@/lib/utils/dates";
import type { TaskPriority, TaskStatus } from "@/lib/types/domain";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");
  return { supabase, user };
}

function revalidateTaskViews(projectId?: string | null) {
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export type TaskInput = {
  title: string;
  description?: string | null;
  project_id?: string | null;
  key_result_id?: string | null;
  parent_task_id?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  start_date?: string | null;
  due_date?: string | null;
  duration_days?: number;
  recurrence_rule?: string | null;
  tags?: string[];
  estimate_hours?: number | null;
  reminder_minutes_before?: number | null;
};

export async function createTask(input: TaskInput) {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description ?? null,
      project_id: input.project_id ?? null,
      key_result_id: input.key_result_id ?? null,
      parent_task_id: input.parent_task_id ?? null,
      priority: input.priority ?? "medium",
      status: input.status ?? "todo",
      start_date: input.start_date ?? null,
      due_date: input.due_date ?? null,
      duration_days: input.duration_days ?? 1,
      recurrence_rule: input.recurrence_rule ?? null,
      tags: input.tags ?? [],
      estimate_hours: input.estimate_hours ?? null,
      reminder_minutes_before: input.reminder_minutes_before ?? null,
    })
    .select("id, project_id")
    .single();

  if (error) return { error: error.message };
  revalidateTaskViews(data.project_id);
  return { error: null, id: data.id };
}

export async function updateTask(id: string, input: Partial<TaskInput>) {
  const { supabase } = await requireUser();

  const { data, error } = await supabase
    .from("tasks")
    .update(input)
    .eq("id", id)
    .select("project_id")
    .single();

  if (error) return { error: error.message };
  revalidateTaskViews(data?.project_id);
  return { error: null };
}

export async function deleteTask(id: string) {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("tasks").select("project_id").eq("id", id).single();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateTaskViews(data?.project_id);
  return { error: null };
}

/**
 * Bascule une tâche entre "terminée" et "à faire".
 * Si la tâche est récurrente et qu'on la termine, crée automatiquement
 * la prochaine occurrence (même titre, échéance décalée selon la règle).
 */
export async function toggleTaskDone(id: string) {
  const { supabase, user } = await requireUser();

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !task) return { error: fetchError?.message ?? "Tâche introuvable." };

  const willBeDone = task.status !== "done";

  const { error } = await supabase
    .from("tasks")
    .update({
      status: willBeDone ? "done" : "todo",
      completed_at: willBeDone ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  if (willBeDone && task.recurrence_rule) {
    const baseDate = task.due_date ? new Date(task.due_date) : new Date();
    const nextDue = getNextOccurrence(baseDate, task.recurrence_rule);
    const nextStart = task.start_date
      ? getNextOccurrence(parseFlexibleDate(task.start_date), task.recurrence_rule)
      : null;

    await supabase.from("tasks").insert({
      user_id: user.id,
      project_id: task.project_id,
      key_result_id: task.key_result_id,
      parent_task_id: task.parent_task_id,
      title: task.title,
      description: task.description,
      status: "todo",
      priority: task.priority,
      start_date: nextStart ? nextStart.toISOString().slice(0, 10) : null,
      due_date: nextDue.toISOString(),
      duration_days: task.duration_days,
      recurrence_rule: task.recurrence_rule,
      tags: task.tags,
      estimate_hours: task.estimate_hours,
      reminder_minutes_before: task.reminder_minutes_before,
    });
  }

  revalidateTaskViews(task.project_id);
  return { error: null };
}

/** Réordonnancement en masse pour le tableau Kanban (glisser-déposer). */
export async function reorderTasks(
  updates: { id: string; status: TaskStatus; position: number }[],
  projectId?: string | null
) {
  const { supabase } = await requireUser();

  await Promise.all(
    updates.map(({ id, status, position }) =>
      supabase.from("tasks").update({ status, position }).eq("id", id)
    )
  );

  revalidateTaskViews(projectId);
  return { error: null };
}

export async function addDependency(taskId: string, dependsOnTaskId: string, projectId?: string | null) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("task_dependencies")
    .insert({ user_id: user.id, task_id: taskId, depends_on_task_id: dependsOnTaskId });
  if (error) return { error: error.message };
  if (projectId) revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function removeDependency(dependencyId: string, projectId?: string | null) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("task_dependencies").delete().eq("id", dependencyId);
  if (error) return { error: error.message };
  if (projectId) revalidatePath(`/projects/${projectId}`);
  return { error: null };
}
