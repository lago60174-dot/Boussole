"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label } from "@/components/ui/Field";
import { createProject, updateProject, deleteProject, type ProjectInput } from "@/lib/actions/projects";
import type { Project, ProjectStatus } from "@/lib/types/domain";
import { PROJECT_STATUS_LABELS } from "@/lib/types/domain";

const COLOR_CHOICES = [
  "#5B4B8A", "#2E7D75", "#B8752A", "#A8452F", "#1F3A5F", "#3E8F63",
];

export function ProjectFormModal({
  open,
  onClose,
  project,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onCreated?: (id: string) => void;
}) {
  const isEdit = Boolean(project);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [color, setColor] = useState(project?.color ?? COLOR_CHOICES[0]);

  function handleSubmit(formData: FormData) {
    setError(null);
    const input: ProjectInput = {
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "") || null,
      color,
      status: String(formData.get("status")) as ProjectStatus,
      start_date: String(formData.get("start_date") ?? "") || null,
      target_date: String(formData.get("target_date") ?? "") || null,
    };
    if (!input.name) {
      setError("Le nom est obligatoire.");
      return;
    }

    startTransition(async () => {
      const result = isEdit ? await updateProject(project!.id, input) : await createProject(input);
      if (result.error) setError(result.error);
      else {
        onClose();
        if (!isEdit && result.id) onCreated?.(result.id);
      }
    });
  }

  function handleDelete() {
    if (!project) return;
    startTransition(async () => {
      await deleteProject(project.id);
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Modifier le projet" : "Nouveau projet"}>
      <form action={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Nom</Label>
          <Input id="name" name="name" defaultValue={project?.name} required autoFocus />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={2} defaultValue={project?.description ?? ""} />
        </div>

        <div>
          <Label>Couleur</Label>
          <div className="flex gap-2">
            {COLOR_CHOICES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-7 w-7 rounded-full ring-offset-2"
                style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Début</Label>
            <Input id="start_date" name="start_date" type="date" defaultValue={project?.start_date ?? ""} />
          </div>
          <div>
            <Label htmlFor="target_date">Échéance cible</Label>
            <Input id="target_date" name="target_date" type="date" defaultValue={project?.target_date ?? ""} />
          </div>
        </div>

        <div>
          <Label htmlFor="status">Statut</Label>
          <Select id="status" name="status" defaultValue={project?.status ?? "active"}>
            {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
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
