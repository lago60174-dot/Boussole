"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProjectStatus } from "@/lib/types/domain";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");
  return { supabase, user };
}

export type ProjectInput = {
  name: string;
  description?: string | null;
  color?: string;
  status?: ProjectStatus;
  start_date?: string | null;
  target_date?: string | null;
};

// Type de retour unifié pour createProject/updateProject : évite qu'une
// union ambiguë ({error,id} | {error}) fasse échouer le contrôle de type
// côté client sur `"id" in result`.
export type ProjectActionResult = { error: string | null; id?: string };

export async function createProject(input: ProjectInput): Promise<ProjectActionResult> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: user.id, ...input })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { error: null, id: data.id };
}

export async function updateProject(id: string, input: Partial<ProjectInput>): Promise<ProjectActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("projects").update(input).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteProject(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { error: null };
}
