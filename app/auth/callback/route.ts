import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Point d'atterrissage des liens envoyés par Supabase Auth
 * (confirmation d'e-mail, lien magique). Échange le "code" contre
 * une session, puis redirige vers l'application.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
