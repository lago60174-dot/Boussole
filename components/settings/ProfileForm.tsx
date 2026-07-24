"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { signOutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";

const TIMEZONES = [
  "Europe/Paris", "Europe/London", "Africa/Douala", "Africa/Casablanca", "Africa/Dakar",
  "America/Montreal", "America/New_York", "Indian/Antananarivo", "Asia/Dubai", "UTC",
];

export function ProfileForm({ displayName, timezone, email }: { displayName: string; timezone: string; email: string }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(formData: FormData) {
    setSaved(false);
    startTransition(async () => {
      await updateProfile({
        display_name: String(formData.get("display_name") ?? ""),
        timezone: String(formData.get("timezone") ?? "Europe/Paris"),
      });
      setSaved(true);
    });
  }

  return (
    <div className="rounded-xl border border-line bg-canvas-raised p-4">
      <h3 className="mb-3 text-sm font-medium text-ink">Profil</h3>
      <form action={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" value={email} disabled className="opacity-60" />
        </div>
        <div>
          <Label htmlFor="display_name">Nom affiché</Label>
          <Input id="display_name" name="display_name" defaultValue={displayName} />
        </div>
        <div>
          <Label htmlFor="timezone">Fuseau horaire</Label>
          <Select id="timezone" name="timezone" defaultValue={timezone}>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button>
          {saved && <span className="text-xs text-success">Enregistré.</span>}
        </div>
      </form>

      <form action={signOutAction} className="mt-4 border-t border-line pt-4">
        <Button type="submit" variant="ghost" size="sm" className="!text-danger">Se déconnecter</Button>
      </form>
    </div>
  );
}
