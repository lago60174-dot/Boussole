"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createKeyResult } from "@/lib/actions/objectives";

export function AddKeyResultForm({ objectiveId }: { objectiveId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(100);
  const [unit, setUnit] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      await createKeyResult({
        objective_id: objectiveId,
        title: title.trim(),
        target_value: target,
        start_value: 0,
        current_value: 0,
        unit: unit || null,
      });
      setTitle("");
      setTarget(100);
      setUnit("");
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs font-medium text-objectives hover:underline"
      >
        <Plus size={12} /> Ajouter un résultat clé
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Résultat clé, ex : Signer 5 clients"
        className="min-w-40 flex-1 rounded-md border border-line bg-canvas-raised px-2 py-1 text-xs"
      />
      <input
        type="number"
        value={target}
        onChange={(e) => setTarget(Number(e.target.value))}
        className="w-16 rounded-md border border-line bg-canvas-raised px-2 py-1 text-xs"
        aria-label="Valeur cible"
      />
      <input
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        placeholder="unité"
        className="w-16 rounded-md border border-line bg-canvas-raised px-2 py-1 text-xs"
      />
      <button type="submit" disabled={pending} className="rounded-md bg-objectives px-2 py-1 text-xs font-medium text-white">
        Ajouter
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink-soft">
        Annuler
      </button>
    </form>
  );
}
