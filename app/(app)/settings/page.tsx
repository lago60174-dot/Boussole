import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { NotificationSettings } from "@/components/settings/NotificationSettings";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, timezone")
    .eq("id", user?.id ?? "")
    .single();

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">Paramètres</h1>
      <div className="flex max-w-lg flex-col gap-4">
        <ProfileForm
          displayName={profile?.display_name ?? ""}
          timezone={profile?.timezone ?? "Europe/Paris"}
          email={user?.email ?? ""}
        />
        <NotificationSettings />
      </div>
    </div>
  );
}
