"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label } from "@/components/ui/Field";
import { createEvent, updateEvent, deleteEvent, type EventInput } from "@/lib/actions/events";
import { RECURRENCE_PRESETS } from "@/lib/utils/recurrence";
import type { CalendarEvent } from "@/lib/types/domain";

function toLocalDateTimeInput(iso: string) {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function EventFormModal({
  open,
  onClose,
  event,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  defaultDate?: Date | null;
}) {
  const isEdit = Boolean(event);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [allDay, setAllDay] = useState(event?.all_day ?? false);

  const defaultStart = event
    ? toLocalDateTimeInput(event.start_at)
    : defaultDate
      ? toLocalDateTimeInput(new Date(defaultDate.setHours(9, 0, 0, 0)).toISOString())
      : "";
  const defaultEnd = event
    ? toLocalDateTimeInput(event.end_at)
    : defaultDate
      ? toLocalDateTimeInput(new Date(defaultDate.setHours(10, 0, 0, 0)).toISOString())
      : "";

  function handleSubmit(formData: FormData) {
    setError(null);
    const startRaw = String(formData.get("start_at") ?? "");
    const endRaw = String(formData.get("end_at") ?? "");
    if (!startRaw || !endRaw) {
      setError("Indique une date de début et de fin.");
      return;
    }

    const input: EventInput = {
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "") || null,
      location: String(formData.get("location") ?? "") || null,
      start_at: new Date(startRaw).toISOString(),
      end_at: new Date(endRaw).toISOString(),
      all_day: allDay,
      recurrence_rule: String(formData.get("recurrence_rule") ?? "") || null,
      reminder_minutes_before: formData.get("reminder") ? Number(formData.get("reminder")) : null,
    };

    if (!input.title) {
      setError("Le titre est obligatoire.");
      return;
    }
    if (new Date(input.end_at) < new Date(input.start_at)) {
      setError("La fin doit être après le début.");
      return;
    }

    startTransition(async () => {
      const result = isEdit ? await updateEvent(event!.id, input) : await createEvent(input);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  function handleDelete() {
    if (!event) return;
    startTransition(async () => {
      await deleteEvent(event.id);
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Modifier l'événement" : "Nouvel événement"}>
      <form action={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="title">Titre</Label>
          <Input id="title" name="title" defaultValue={event?.title} required autoFocus />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="h-4 w-4 rounded border-line"
          />
          Toute la journée
        </label>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_at">Début</Label>
            <Input
              id="start_at"
              name="start_at"
              type={allDay ? "date" : "datetime-local"}
              defaultValue={defaultStart}
              required
            />
          </div>
          <div>
            <Label htmlFor="end_at">Fin</Label>
            <Input
              id="end_at"
              name="end_at"
              type={allDay ? "date" : "datetime-local"}
              defaultValue={defaultEnd}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="location">Lieu</Label>
          <Input id="location" name="location" defaultValue={event?.location ?? ""} />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={2} defaultValue={event?.description ?? ""} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="recurrence_rule">Récurrence</Label>
            <Select id="recurrence_rule" name="recurrence_rule" defaultValue={event?.recurrence_rule ?? ""}>
              {RECURRENCE_PRESETS.map((p) => (
                <option key={p.label} value={p.value ?? ""}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="reminder">Rappel</Label>
            <Select id="reminder" name="reminder" defaultValue={event?.reminder_minutes_before ?? 30}>
              <option value="">Aucun</option>
              <option value="10">10 min avant</option>
              <option value="30">30 min avant</option>
              <option value="60">1 h avant</option>
              <option value="1440">1 jour avant</option>
            </Select>
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="mt-2 flex items-center justify-between">
          {isEdit ? (
            <Button type="button" variant="ghost" onClick={handleDelete} className="!text-danger">
              Supprimer
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
