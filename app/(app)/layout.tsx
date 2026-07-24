import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Deuxième vérification côté Server Component (proxy.ts ne fait qu'une
  // redirection optimiste) : c'est ici que l'accès est réellement tranché.
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name || user.email || "Compte";

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar displayName={displayName} />
      <main className="flex-1 overflow-x-hidden pb-20 sm:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
