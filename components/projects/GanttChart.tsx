"use client";

import { useMemo, useState } from "react";
import { addDays, differenceInCalendarDays, eachDayOfInterval, format, isToday, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";
import { Link2, X } from "lucide-react";
import { clsx } from "clsx";
import type { Task, TaskDependency } from "@/lib/types/domain";
import { addDependency, removeDependency } from "@/lib/actions/tasks";
import { parseFlexibleDate } from "@/lib/utils/dates";
import { Select, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const COL_WIDTH = 34;
const ROW_HEIGHT = 40;

function taskStart(task: Task): Date {
  if (task.start_date) return parseFlexibleDate(task.start_date);
  if (task.due_date) return addDays(new Date(task.due_date), -(task.duration_days || 1) + 1);
  return new Date();
}

export function GanttChart({
  tasks,
  dependencies,
  projectId,
  onEditTask,
}: {
  tasks: Task[];
  dependencies: TaskDependency[];
  projectId: string;
  onEditTask: (task: Task) => void;
}) {
  const [depTaskId, setDepTaskId] = useState("");
  const [depOnId, setDepOnId] = useState("");
  const [pending, setPending] = useState(false);

  const rows = tasks.filter((t) => !t.parent_task_id);

  const { rangeStart, rangeEnd, days } = useMemo(() => {
    if (rows.length === 0) {
      const start = new Date();
      return { rangeStart: start, rangeEnd: addDays(start, 13), days: eachDayOfInterval({ start, end: addDays(start, 13) }) };
    }
    let min = taskStart(rows[0]);
    let max = addDays(taskStart(rows[0]), rows[0].duration_days || 1);
    for (const t of rows) {
      const s = taskStart(t);
      const e = addDays(s, Math.max(1, t.duration_days || 1));
      if (s < min) min = s;
      if (e > max) max = e;
    }
    const start = addDays(min, -2);
    const end = addDays(max, 3);
    return { rangeStart: start, rangeEnd: end, days: eachDayOfInterval({ start, end }) };
  }, [rows]);

  const gridWidth = days.length * COL_WIDTH;
  const gridHeight = rows.length * ROW_HEIGHT;

  function dayOffset(date: Date) {
    return Math.max(0, differenceInCalendarDays(date, rangeStart));
  }

  const rowIndexById = new Map(rows.map((t, i) => [t.id, i]));

  const relevantDeps = dependencies.filter(
    (d) => rowIndexById.has(d.task_id) && rowIndexById.has(d.depends_on_task_id)
  );

  async function handleAddDependency(e: React.FormEvent) {
    e.preventDefault();
    if (!depTaskId || !depOnId || depTaskId === depOnId) return;
    setPending(true);
    await addDependency(depTaskId, depOnId, projectId);
    setPending(false);
    setDepTaskId("");
    setDepOnId("");
  }

  if (rows.length === 0) {
    return <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-soft">
      Ajoute des tâches avec une date de début pour voir le diagramme de Gantt.
    </p>;
  }

  return (
    <div>
      <div className="flex overflow-hidden rounded-xl border border-line bg-canvas-raised">
        {/* Colonne fixe des titres */}
        <div className="w-44 shrink-0 border-r border-line">
          <div style={{ height: 44 }} className="flex items-center border-b border-line px-3 text-xs font-medium text-ink-soft">
            Tâches
          </div>
          {rows.map((t) => (
            <button
              key={t.id}
              onClick={() => onEditTask(t)}
              style={{ height: ROW_HEIGHT }}
              className="flex w-full items-center truncate border-b border-line px-3 text-left text-xs text-ink hover:bg-line/40"
              title={t.title}
            >
              {t.title}
            </button>
          ))}
        </div>

        {/* Frise défilable */}
        <div className="overflow-x-auto">
          <div style={{ width: gridWidth }}>
            <div className="flex border-b border-line" style={{ height: 44 }}>
              {days.map((d) => (
                <div
                  key={d.toISOString()}
                  style={{ width: COL_WIDTH }}
                  className={clsx(
                    "flex shrink-0 flex-col items-center justify-center border-r border-line text-[10px]",
                    isWeekend(d) && "bg-canvas",
                    isToday(d) && "bg-compass-soft"
                  )}
                >
                  <span className="text-ink-soft">{format(d, "d")}</span>
                  {d.getDate() === 1 && (
                    <span className="capitalize text-ink-soft/70">{format(d, "MMM", { locale: fr })}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="relative" style={{ width: gridWidth, height: gridHeight }}>
              {/* Grille de fond */}
              <div className="absolute inset-0 flex">
                {days.map((d) => (
                  <div
                    key={d.toISOString()}
                    style={{ width: COL_WIDTH }}
                    className={clsx("h-full shrink-0 border-r border-line", (isWeekend(d) || isToday(d)) && "bg-canvas/70")}
                  />
                ))}
              </div>

              {/* Lignes de dépendance */}
              <svg width={gridWidth} height={gridHeight} className="pointer-events-none absolute inset-0">
                <defs>
                  <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="var(--color-ink-soft)" />
                  </marker>
                </defs>
                {relevantDeps.map((dep) => {
                  const fromTask = rows.find((t) => t.id === dep.depends_on_task_id)!;
                  const toTask = rows.find((t) => t.id === dep.task_id)!;
                  const fromRow = rowIndexById.get(dep.depends_on_task_id)!;
                  const toRow = rowIndexById.get(dep.task_id)!;
                  const fromX = (dayOffset(taskStart(fromTask)) + Math.max(1, fromTask.duration_days || 1)) * COL_WIDTH;
                  const fromY = fromRow * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const toX = dayOffset(taskStart(toTask)) * COL_WIDTH;
                  const toY = toRow * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const midX = fromX + Math.max(8, (toX - fromX) / 2);
                  return (
                    <path
                      key={dep.id}
                      d={`M${fromX},${fromY} H${midX} V${toY} H${toX}`}
                      fill="none"
                      stroke="var(--color-ink-soft)"
                      strokeWidth={1.5}
                      markerEnd="url(#arrow)"
                    />
                  );
                })}
              </svg>

              {/* Barres de tâches */}
              {rows.map((t, i) => {
                const start = taskStart(t);
                const left = dayOffset(start) * COL_WIDTH;
                const width = Math.max(1, t.duration_days || 1) * COL_WIDTH - 4;
                const color = t.project?.color || "var(--color-compass)";
                return (
                  <button
                    key={t.id}
                    onClick={() => onEditTask(t)}
                    style={{
                      position: "absolute",
                      left: left + 2,
                      top: i * ROW_HEIGHT + 8,
                      width,
                      height: ROW_HEIGHT - 16,
                      backgroundColor: t.status === "done" ? "var(--color-success)" : color,
                    }}
                    className="flex items-center overflow-hidden rounded-md px-2 text-left text-[11px] font-medium text-white shadow-sm"
                    title={`${t.title} · ${t.duration_days || 1}j`}
                  >
                    <span className="truncate">{t.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Gestion des dépendances */}
      <div className="mt-6 rounded-xl border border-line bg-canvas-raised p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-ink">
          <Link2 size={14} /> Dépendances
        </h3>

        <form onSubmit={handleAddDependency} className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-40">
            <Label htmlFor="dep-task">Cette tâche…</Label>
            <Select id="dep-task" value={depTaskId} onChange={(e) => setDepTaskId(e.target.value)}>
              <option value="">Choisir</option>
              {rows.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </Select>
          </div>
          <div className="min-w-40">
            <Label htmlFor="dep-on">…dépend de</Label>
            <Select id="dep-on" value={depOnId} onChange={(e) => setDepOnId(e.target.value)}>
              <option value="">Choisir</option>
              {rows.filter((t) => t.id !== depTaskId).map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </Select>
          </div>
          <Button type="submit" size="sm" disabled={pending || !depTaskId || !depOnId}>
            Lier
          </Button>
        </form>

        <div className="flex flex-col gap-1.5">
          {relevantDeps.length === 0 && <p className="text-xs text-ink-soft">Aucune dépendance définie.</p>}
          {relevantDeps.map((dep) => {
            const from = rows.find((t) => t.id === dep.depends_on_task_id);
            const to = rows.find((t) => t.id === dep.task_id);
            return (
              <div key={dep.id} className="flex items-center justify-between rounded-lg bg-canvas px-3 py-1.5 text-xs">
                <span>
                  <strong className="text-ink">{to?.title}</strong> dépend de{" "}
                  <strong className="text-ink">{from?.title}</strong>
                </span>
                <button
                  onClick={() => removeDependency(dep.id, projectId)}
                  className="text-ink-soft hover:text-danger"
                  aria-label="Retirer la dépendance"
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
