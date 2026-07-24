"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createTask } from "@/lib/actions/tasks";

export function QuickAddTask({ projectId }: { projectId?: string | null }) {
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await createTask({ title: trimmed, project_id: projectId ?? null });
      setTitle("");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-lg border border-dashed border-line px-3 py-2.5 focus-within:border-compass"
    >
      <Plus size={16} className="shrink-0 text-ink-soft" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ajouter une tâche et appuyer sur Entrée…"
        disabled={pending}
        className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
      />
    </form>
  );
}
