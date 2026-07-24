"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar } from "lucide-react";
import type { Project } from "@/lib/types/domain";
import { PROJECT_STATUS_LABELS } from "@/lib/types/domain";
import { ProgressBar } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProjectFormModal } from "./ProjectFormModal";
import { formatDateFr } from "@/lib/utils/dates";

type ProjectWithProgress = Project & { done: number; total: number };

export function ProjectsView({ projects }: { projects: ProjectWithProgress[] }) {
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">Projets</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus size={15} /> Nouveau projet
        </Button>
      </div>

      {projects.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-soft">
          Aucun projet pour l'instant. Crée le premier pour organiser tes tâches en Kanban et en Gantt.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push(`/projects/${p.id}`)}
              className="flex flex-col rounded-xl border border-line bg-canvas-raised p-4 text-left transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <h3 className="truncate font-medium text-ink">{p.name}</h3>
              </div>
              {p.description && <p className="mb-3 line-clamp-2 text-xs text-ink-soft">{p.description}</p>}
              <div className="mt-auto flex flex-col gap-2">
                <ProgressBar value={p.total ? p.done / p.total : 0} color={p.color} />
                <div className="flex items-center justify-between text-xs text-ink-soft">
                  <span>
                    {p.done}/{p.total} tâches
                  </span>
                  <span className="rounded-full bg-line/60 px-2 py-0.5">{PROJECT_STATUS_LABELS[p.status]}</span>
                </div>
                {p.target_date && (
                  <span className="flex items-center gap-1 text-xs text-ink-soft">
                    <Calendar size={11} /> {formatDateFr(p.target_date)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <ProjectFormModal
        open={creating}
        onClose={() => setCreating(false)}
        project={null}
        onCreated={(id) => router.push(`/projects/${id}`)}
      />
    </div>
  );
}
