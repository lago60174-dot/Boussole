"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label } from "@/components/ui/Field";
import { createTask, updateTask, deleteTask, type TaskInput } from "@/lib/actions/tasks";
import { RECURRENCE_PRESETS } from "@/lib/utils/recurrence";
import type { Task, TaskPriority } from "@/lib/types/domain";
import { PRIORITY_LABELS } from "@/lib/types/domain";

type ProjectOption = { id: string; name: string; color: string };

export function TaskFormModal({
  open,
  onClose,
  task,
  projects,
  defaultProjectId,
}: {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  projects: ProjectOption[];
  defaultProjectId?: string | null;
}) {
  const isEdit = Boolean(task);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toLocalDateTimeInput(iso: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    const dueRaw = String(formData.get("due_date") ?? "");
    const input: TaskInput = {
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "") || null,
      project_id: String(formData.get("project_id") ?? "") || null,
      priority: String(formData.get("priority")) as TaskPriority,
      due_date: dueRaw ? new Date(dueRaw).toISOString() : null,
      start_date: String(formData.get("start_date") ?? "") || null,
      duration_days: Number(formData.get("duration_days") ?? 1) || 1,
      recurrence_rule: String(formData.get("recurrence_rule") ?? "") || null,
      tags: String(formData.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      reminder_minutes_before: formData.get("reminder")
        ? Number(formData.get("reminder"))
        : null,
    };

    if (!input.title) {
      setError("Le titre est obligatoire.");
      return;
    }

    startTransition(async () => {
      const result = isEdit ? await updateTask(task!.id, input) : await createTask(input);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  function handleDelete() {
    if (!task) return;
    startTransition(async () => {
      await deleteTask(task.id);
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Modifier la tâche" : "Nouvelle tâche"} wide>
      <form action={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="title">Titre</Label>
          <Input id="title" name="title" defaultValue={task?.title} required autoFocus />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={2} defaultValue={task?.description ?? ""} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority">Priorité</Label>
            <Select id="priority" name="priority" defaultValue={task?.priority ?? "medium"}>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="project_id">Projet</Label>
            <Select
              id="project_id"
              name="project_id"
              defaultValue={task?.project_id ?? defaultProjectId ?? ""}
            >
              <option value="">Aucun</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Début (pour le Gantt)</Label>
            <Input id="start_date" name="start_date" type="date" defaultValue={task?.start_date ?? ""} />
          </div>
          <div>
            <Label htmlFor="due_date">Échéance</Label>
            <Input
              id="due_date"
              name="due_date"
              type="datetime-local"
              defaultValue={toLocalDateTimeInput(task?.due_date ?? null)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration_days">Durée (jours, pour le Gantt)</Label>
            <Input
              id="duration_days"
              name="duration_days"
              type="number"
              min={1}
              defaultValue={task?.duration_days ?? 1}
            />
          </div>
          <div>
            <Label htmlFor="reminder">Rappel avant échéance</Label>
            <Select id="reminder" name="reminder" defaultValue={task?.reminder_minutes_before ?? ""}>
              <option value="">Aucun</option>
              <option value="10">10 minutes avant</option>
              <option value="30">30 minutes avant</option>
              <option value="60">1 heure avant</option>
              <option value="1440">1 jour avant</option>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="recurrence_rule">Récurrence</Label>
          <Select id="recurrence_rule" name="recurrence_rule" defaultValue={task?.recurrence_rule ?? ""}>
            {RECURRENCE_PRESETS.map((p) => (
              <option key={p.label} value={p.value ?? ""}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
          <Input id="tags" name="tags" defaultValue={task?.tags?.join(", ") ?? ""} placeholder="maison, urgent" />
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
