"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, CalendarClock, Target, ArrowRight } from "lucide-react";
import type { Task, CalendarEvent, Objective, Project } from "@/lib/types/domain";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { ProgressBar } from "@/components/ui/Badge";

type ThreadItem =
  | { kind: "task"; time: Date | null; task: Task }
  | { kind: "event"; time: Date; event: CalendarEvent };

export function DashboardView({
  displayName,
  tasksToday,
  overdueCount,
  eventsToday,
  objectives,
  projects,
  projectOptions,
}: {
  displayName: string;
  tasksToday: Task[];
  overdueCount: number;
  eventsToday: CalendarEvent[];
  objectives: Objective[];
  projects: Project[];
  projectOptions: { id: string; name: string; color: string }[];
}) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const items: ThreadItem[] = [
    ...tasksToday.map((task): ThreadItem => ({ kind: "task", time: task.due_date ? new Date(task.due_date) : null, task })),
    ...eventsToday.map((event): ThreadItem => ({ kind: "event", time: new Date(event.start_at), event })),
  ].sort((a, b) => {
    if (!a.time) return -1;
    if (!b.time) return 1;
    return a.time.getTime() - b.time.getTime();
  });

  const nextEvent = eventsToday
    .filter((e) => new Date(e.start_at) > new Date())
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())[0];

  const atRisk = objectives.filter((o) => o.status === "at_risk" || o.status === "behind").length;

  function objectiveFor(task: Task): Objective | undefined {
    if (!task.project_id) return undefined;
    return objectives.find((o) => o.project_id === task.project_id);
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-ink-soft capitalize">{format(new Date(), "EEEE d MMMM", { locale: fr })}</p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
          Bonjour {displayName}
        </h1>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="En retard" value={overdueCount} accent="var(--color-danger)" icon={<AlertTriangle size={14} />} />
        <StatCard label="Aujourd'hui" value={tasksToday.length} accent="var(--color-tasks)" icon={<CalendarClock size={14} />} />
        <StatCard
          label="Prochain"
          value={nextEvent ? format(new Date(nextEvent.start_at), "HH:mm") : "—"}
          sub={nextEvent?.title}
          accent="var(--color-calendar)"
          icon={<CalendarClock size={14} />}
        />
        <StatCard label="Objectifs à risque" value={atRisk} accent="var(--color-objectives)" icon={<Target size={14} />} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold text-ink">Le fil du jour</h2>

          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-soft">
              Rien de prévu pour aujourd'hui. Profites-en, ou jette un œil à tes objectifs. 🧭
            </p>
          ) : (
            <div className="relative pl-5">
              <div className="thread-line absolute bottom-2 left-[5px] top-2" />
              <div className="flex flex-col gap-4">
                {items.map((item, i) => {
                  const accent =
                    item.kind === "task"
                      ? item.task.status === "done"
                        ? "var(--color-success)"
                        : "var(--color-tasks)"
                      : "var(--color-calendar)";
                  const objective = item.kind === "task" ? objectiveFor(item.task) : undefined;

                  return (
                    <div key={i} className="relative">
                      <span
                        className="thread-node absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: accent }}
                      />
                      {(objective || (item.kind === "task" && item.task.project)) && (
                        <p className="mb-1 flex items-center gap-1 text-[11px] text-ink-soft">
                          {objective && (
                            <>
                              <Target size={10} /> {objective.title}
                              <ArrowRight size={10} />
                            </>
                          )}
                          {item.kind === "task" && item.task.project && item.task.project.name}
                        </p>
                      )}
                      {item.kind === "task" ? (
                        <div className="rounded-lg border border-line bg-canvas-raised">
                          <TaskRow task={item.task} onEdit={setEditingTask} />
                        </div>
                      ) : (
                        <div className="rounded-lg border border-line bg-canvas-raised px-3 py-2">
                          <p className="text-sm text-ink">{item.event.title}</p>
                          <p className="text-xs text-ink-soft">
                            {item.event.all_day ? "Toute la journée" : format(item.time, "HH:mm")}
                            {item.event.location ? ` · ${item.event.location}` : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-ink">Objectifs</h2>
              <Link href="/objectives" className="text-xs text-compass hover:underline">Voir tout</Link>
            </div>
            <div className="flex flex-col gap-3">
              {objectives.slice(0, 3).map((o) => {
                const krs = o.key_results ?? [];
                const ratio =
                  krs.length === 0
                    ? 0
                    : krs.reduce((s, kr) => {
                        const r =
                          kr.target_value === kr.start_value
                            ? 0
                            : Math.max(0, Math.min(1, (kr.current_value - kr.start_value) / (kr.target_value - kr.start_value)));
                        return s + r;
                      }, 0) / krs.length;
                return (
                  <Link key={o.id} href="/objectives" className="rounded-lg border border-line bg-canvas-raised p-3 hover:border-ink-soft">
                    <p className="mb-1.5 truncate text-sm text-ink">{o.title}</p>
                    <ProgressBar value={ratio} color="var(--color-objectives)" />
                  </Link>
                );
              })}
              {objectives.length === 0 && <p className="text-xs text-ink-soft">Aucun objectif défini.</p>}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-ink">Projets actifs</h2>
              <Link href="/projects" className="text-xs text-compass hover:underline">Voir tout</Link>
            </div>
            <div className="flex flex-col gap-2">
              {projects.slice(0, 4).map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center gap-2 rounded-lg border border-line bg-canvas-raised px-3 py-2 hover:border-ink-soft">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="truncate text-sm text-ink">{p.name}</span>
                </Link>
              ))}
              {projects.length === 0 && <p className="text-xs text-ink-soft">Aucun projet actif.</p>}
            </div>
          </div>
        </div>
      </div>

      <TaskFormModal open={Boolean(editingTask)} onClose={() => setEditingTask(null)} task={editingTask} projects={projectOptions} />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-canvas-raised p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs text-ink-soft" style={{ color: accent }}>
        {icon} {label}
      </div>
      <p className="truncate font-[family-name:var(--font-mono)] text-lg font-semibold text-ink">{value}</p>
      {sub && <p className="truncate text-xs text-ink-soft">{sub}</p>}
    </div>
  );
}
