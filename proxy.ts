import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Depuis Next.js 16, middleware.ts est remplacé par proxy.ts.
 * Rôle volontairement limité (principe du "thin proxy") :
 *  1. Rafraîchir le cookie de session Supabase si besoin.
 *  2. Rediriger de façon optimiste selon la présence d'une session.
 * La vérification d'autorisation faisant foi reste faite dans
 * app/(app)/layout.tsx via supabase.auth.getUser() côté Server Component.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Ne rien exécuter entre createServerClient et getUser() : cela pourrait
  // empêcher le rafraîchissement du token et déconnecter l'utilisateur.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");
  // Les routes /api (ex. le cron de notifications, appelé sans cookie de
  // session par Vercel) gèrent leur propre autorisation en interne — les
  // rediriger vers /login n'aurait de toute façon aucun sens pour un appel
  // serveur-à-serveur, et empêchait jusqu'ici le cron de s'exécuter.
  const isPublicRoute = isAuthRoute || pathname.startsWith("/auth") || pathname.startsWith("/api");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Exclut les fichiers statiques, l'icône, le manifeste et le service worker
     * pour ne pas alourdir chaque requête d'asset.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)",
  ],
};
