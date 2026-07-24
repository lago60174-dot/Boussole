import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase pour les Client Components (navigateur).
 * À utiliser uniquement pour ce qui doit tourner côté client :
 * Realtime, formulaires interactifs légers, etc.
 * Pour toute lecture/écriture de données, préférer les Server Actions.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
