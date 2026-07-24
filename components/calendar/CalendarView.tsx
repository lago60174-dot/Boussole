"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { clsx } from "clsx";
import type { CalendarEvent, Task } from "@/lib/types/domain";
import { expandOccurrences } from "@/lib/utils/recurrence";
import { EventFormModal } from "./EventFormModal";
import { Button } from "@/components/ui/Button";

type Occurrence = { event: CalendarEvent; date: Date };

export function CalendarView({ events, tasks }: { events: CalendarEvent[]; tasks: Task[] }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [creatingAt, setCreatingAt] = useState<Date | null>(null);

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd]);

  const occurrencesByDay = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    for (const event of events) {
      const occs = expandOccurrences(new Date(event.start_at), event.recurrence_rule, gridStart, gridEnd);
      for (const date of occs) {
        const key = format(date, "yyyy-MM-dd");
        map.set(key, [...(map.get(key) ?? []), { event, date }]);
      }
    }
    return map;
  }, [events, gridStart, gridEnd]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.due_date || task.status === "done" || task.status === "cancelled") continue;
      const key = format(new Date(task.due_date), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return map;
  }, [tasks]);

  const selectedKey = format(selectedDay, "yyyy-MM-dd");
  const selectedOccurrences = occurrencesByDay.get(selectedKey) ?? [];
  const selectedTasks = tasksByDay.get(selectedKey) ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold capitalize text-ink">
          {format(month, "MMMM yyyy", { locale: fr })}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            className="rounded-lg border border-line p-1.5 text-ink-soft hover:text-ink"
            aria-label="Mois précédent"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setMonth(startOfMonth(new Date()))}
            className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:text-ink"
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            className="rounded-lg border border-line p-1.5 text-ink-soft hover:text-ink"
            aria-label="Mois suivant"
          >
            <ChevronRight size={16} />
          </button>
          <Button size="sm" onClick={() => setCreatingAt(selectedDay)} className="ml-2">
            <Plus size={14} /> Événement
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-line bg-canvas-raised">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <div key={d} className="border-b border-line px-2 py-2 text-center text-xs font-medium text-ink-soft">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayOccs = occurrencesByDay.get(key) ?? [];
          const dayTasks = tasksByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, month);
          const selected = isSameDay(day, selectedDay);

          return (
            <button
              key={key}
              onClick={() => setSelectedDay(day)}
              className={clsx(
                "flex min-h-20 flex-col items-start gap-1 border-b border-r border-line p-1.5 text-left last:border-r-0 [&:nth-child(7n)]:border-r-0",
                !inMonth && "bg-canvas/60 text-ink-soft/50",
                selected && "ring-2 ring-inset ring-compass"
              )}
            >
              <span
                className={clsx(
                  "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                  isToday(day) ? "bg-compass text-white" : "text-ink-soft"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="flex w-full flex-col gap-0.5">
                {dayOccs.slice(0, 2).map(({ event }, i) => (
                  <span
                    key={event.id + i}
                    className="truncate rounded px-1 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: event.color + "22", color: event.color }}
                  >
                    {event.title}
                  </span>
                ))}
                {dayTasks.slice(0, Math.max(0, 2 - dayOccs.length)).map((task) => (
                  <span
                    key={task.id}
                    className="truncate rounded bg-tasks-soft px-1 py-0.5 text-[10px] font-medium text-tasks"
                  >
                    ✓ {task.title}
                  </span>
                ))}
                {dayOccs.length + dayTasks.length > 2 && (
                  <span className="text-[10px] text-ink-soft">+{dayOccs.length + dayTasks.length - 2}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold capitalize text-ink">
          {format(selectedDay, "EEEE d MMMM", { locale: fr })}
        </h2>
        <div className="flex flex-col gap-2">
          {selectedOccurrences.length === 0 && selectedTasks.length === 0 && (
            <p className="text-sm text-ink-soft">Rien de prévu.</p>
          )}
          {selectedOccurrences
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(({ event, date }) => (
              <button
                key={event.id + date.toISOString()}
                onClick={() => setEditingEvent(event)}
                className="flex items-center gap-3 rounded-lg border border-line bg-canvas-raised px-3 py-2 text-left hover:border-ink-soft"
              >
                <span className="h-full w-1 self-stretch rounded-full" style={{ backgroundColor: event.color }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{event.title}</p>
                  <p className="text-xs text-ink-soft">
                    {event.all_day ? "Toute la journée" : `${format(date, "HH:mm")} – ${format(new Date(event.end_at), "HH:mm")}`}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                </div>
              </button>
            ))}
          {selectedTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 rounded-lg border border-dashed border-line px-3 py-2">
              <span className="h-full w-1 self-stretch rounded-full bg-tasks" />
              <p className="text-sm text-ink">✓ {task.title} <span className="text-xs text-ink-soft">(échéance de tâche)</span></p>
            </div>
          ))}
        </div>
      </div>

      <EventFormModal open={Boolean(creatingAt)} onClose={() => setCreatingAt(null)} event={null} defaultDate={creatingAt} />
      <EventFormModal open={Boolean(editingEvent)} onClose={() => setEditingEvent(null)} event={editingEvent} />
    </div>
  );
}
