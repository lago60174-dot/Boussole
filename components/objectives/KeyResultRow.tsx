"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import type { KeyResult } from "@/lib/types/domain";
import { updateKeyResultProgress, deleteKeyResult } from "@/lib/actions/objectives";
import { ProgressBar } from "@/components/ui/Badge";

export function KeyResultRow({ kr }: { kr: KeyResult }) {
  const [value, setValue] = useState(kr.current_value);
  const [, startTransition] = useTransition();

  const ratio =
    kr.target_value === kr.start_value
      ? 0
      : Math.max(0, Math.min(1, (value - kr.start_value) / (kr.target_value - kr.start_value)));

  function commit(next: number) {
    setValue(next);
    startTransition(async () => {
      await updateKeyResultProgress(kr.id, next);
    });
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-canvas px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-ink">{kr.title}</span>
        <div className="flex items-center gap-2">
          {kr.metric_type === "boolean" ? (
            <button
              onClick={() => commit(value >= kr.target_value ? kr.start_value : kr.target_value)}
              className="text-xs font-medium text-compass"
            >
              {value >= kr.target_value ? "Atteint ✓" : "Marquer atteint"}
            </button>
          ) : (
            <div className="flex items-center gap-1 text-xs text-ink-soft">
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                onBlur={() => commit(value)}
                className="w-14 rounded border border-line bg-canvas-raised px-1 py-0.5 text-right text-xs"
              />
              <span>
                / {kr.target_value} {kr.unit ?? ""}
              </span>
            </div>
          )}
          <button
            onClick={() => startTransition(async () => { await deleteKeyResult(kr.id); })}
            className="text-ink-soft hover:text-danger"
            aria-label="Supprimer le résultat clé"
          >
            <X size={12} />
          </button>
        </div>
      </div>
      <ProgressBar value={ratio} color="var(--color-objectives)" />
    </div>
  );
}
