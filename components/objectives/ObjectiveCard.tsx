"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { Objective } from "@/lib/types/domain";
import { OBJECTIVE_STATUS_LABELS } from "@/lib/types/domain";
import { KeyResultRow } from "./KeyResultRow";
import { AddKeyResultForm } from "./AddKeyResultForm";
import { ProgressBar } from "@/components/ui/Badge";
import { ObjectiveFormModal } from "./ObjectiveFormModal";
import { formatDateFr } from "@/lib/utils/dates";

const STATUS_COLOR: Record<string, string> = {
  not_started: "var(--color-ink-soft)",
  on_track: "var(--color-success)",
  at_risk: "var(--color-warning)",
  behind: "var(--color-danger)",
  completed: "var(--color-compass)",
};

export function ObjectiveCard({
  objective,
  projects,
}: {
  objective: Objective;
  projects: { id: string; name: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const krs = objective.key_results ?? [];

  const avgRatio =
    krs.length === 0
      ? 0
      : krs.reduce((sum, kr) => {
          const r =
            kr.target_value === kr.start_value
              ? 0
              : Math.max(0, Math.min(1, (kr.current_value - kr.start_value) / (kr.target_value - kr.start_value)));
          return sum + r;
        }, 0) / krs.length;

  return (
    <div className="rounded-xl border border-line bg-canvas-raised p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-ink">{objective.title}</h3>
          {objective.description && <p className="mt-0.5 text-xs text-ink-soft">{objective.description}</p>}
        </div>
        <button onClick={() => setEditing(true)} className="shrink-0 text-ink-soft hover:text-ink" aria-label="Modifier">
          <Pencil size={13} />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span
          className="rounded-full px-2 py-0.5 font-medium"
          style={{ color: STATUS_COLOR[objective.status], backgroundColor: STATUS_COLOR[objective.status] + "1a" }}
        >
          {OBJECTIVE_STATUS_LABELS[objective.status]}
        </span>
        {objective.project && (
          <span className="rounded-full px-2 py-0.5" style={{ color: objective.project.color, backgroundColor: objective.project.color + "22" }}>
            {objective.project.name}
          </span>
        )}
        {objective.period_end && <span className="text-ink-soft">Échéance : {formatDateFr(objective.period_end)}</span>}
      </div>

      <div className="mb-3">
        <ProgressBar value={avgRatio} color="var(--color-objectives)" />
        <p className="mt-1 text-xs text-ink-soft">{Math.round(avgRatio * 100)}% en moyenne sur {krs.length} résultat(s) clé</p>
      </div>

      <div className="flex flex-col gap-2">
        {krs.map((kr) => (
          <KeyResultRow key={kr.id} kr={kr} />
        ))}
      </div>

      <div className="mt-3">
        <AddKeyResultForm objectiveId={objective.id} />
      </div>

      <ObjectiveFormModal open={editing} onClose={() => setEditing(false)} objective={objective} projects={projects} />
    </div>
  );
}
