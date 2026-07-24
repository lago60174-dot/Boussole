"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Objective } from "@/lib/types/domain";
import { ObjectiveCard } from "./ObjectiveCard";
import { ObjectiveFormModal } from "./ObjectiveFormModal";
import { Button } from "@/components/ui/Button";

export function ObjectivesView({
  objectives,
  projects,
}: {
  objectives: Objective[];
  projects: { id: string; name: string }[];
}) {
  const [creating, setCreating] = useState(false);

  const active = objectives.filter((o) => o.status !== "completed");
  const completed = objectives.filter((o) => o.status === "completed");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">Objectifs</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus size={15} /> Nouvel objectif
        </Button>
      </div>

      {objectives.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-soft">
          Définis ton premier objectif et découpe-le en résultats clés mesurables.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {active.map((o) => (
              <ObjectiveCard key={o.id} objective={o} projects={projects} />
            ))}
          </div>

          {completed.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-medium text-ink-soft">Atteints</h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {completed.map((o) => (
                  <ObjectiveCard key={o.id} objective={o} projects={projects} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ObjectiveFormModal open={creating} onClose={() => setCreating(false)} objective={null} projects={projects} />
    </div>
  );
}
