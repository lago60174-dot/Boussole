"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label } from "@/components/ui/Field";
import { createObjective, updateObjective, deleteObjective, type ObjectiveInput } from "@/lib/actions/objectives";
import type { Objective, ObjectiveStatus } from "@/lib/types/domain";
import { OBJECTIVE_STATUS_LABELS } from "@/lib/types/domain";

type ProjectOption = { id: string; name: string };

export function ObjectiveFormModal({
  open,
  onClose,
  objective,
  projects,
}: {
  open: boolean;
  onClose: () => void;
  objective: Objective | null;
  projects: ProjectOption[];
}) {
  const isEdit = Boolean(objective);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    const input: ObjectiveInput = {
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "") || null,
      project_id: String(formData.get("project_id") ?? "") || null,
      status: String(formData.get("status")) as ObjectiveStatus,
      period_start: String(formData.get("period_start") ?? "") || null,
      period_end: String(formData.get("period_end") ?? "") || null,
    };
    if (!input.title) {
      setError("Le titre est obligatoire.");
      return;
    }
    startTransition(async () => {
      const result = isEdit ? await updateObjective(objective!.id, input) : await createObjective(input);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  function handleDelete() {
    if (!objective) return;
    startTransition(async () => {
      await deleteObjective(objective.id);
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Modifier l'objectif" : "Nouvel objectif"}>
      <form action={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="title">Objectif</Label>
          <Input id="title" name="title" defaultValue={objective?.title} required autoFocus placeholder="Ex : Lancer mon activité indépendante" />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={2} defaultValue={objective?.description ?? ""} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="period_start">Début de période</Label>
            <Input id="period_start" name="period_start" type="date" defaultValue={objective?.period_start ?? ""} />
          </div>
          <div>
            <Label htmlFor="period_end">Fin de période</Label>
            <Input id="period_end" name="period_end" type="date" defaultValue={objective?.period_end ?? ""} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="project_id">Projet lié</Label>
            <Select id="project_id" name="project_id" defaultValue={objective?.project_id ?? ""}>
              <option value="">Aucun</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Statut</Label>
            <Select id="status" name="status" defaultValue={objective?.status ?? "not_started"}>
              {Object.entries(OBJECTIVE_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
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
            <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
