"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Compass, Settings } from "lucide-react";

/**
 * En-tête visible uniquement sur mobile (sm:hidden). MobileNav.tsx n'affiche
 * que les 5 sections principales (voir nav-items.ts) : Paramètres n'y a
 * délibérément pas sa place pour ne pas surcharger la barre du bas, mais a
 * besoin d'un point d'accès — contrairement au Sidebar desktop qui a son
 * propre lien "Paramètres" dédié en bas de la barre latérale.
 */
export function MobileHeader() {
  const pathname = usePathname();
  const active = pathname === "/settings";

  return (
    <header className="flex items-center justify-between border-b border-line bg-canvas-raised px-4 py-3 sm:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-compass text-white">
          <Compass size={16} strokeWidth={2.25} />
        </div>
        <span className="font-[family-name:var(--font-display)] text-base font-semibold text-ink">
          Boussole
        </span>
      </div>
      <Link
        href="/settings"
        aria-label="Paramètres"
        className={clsx(
          "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
          active ? "bg-line/70 text-ink" : "text-ink-soft hover:bg-line/40 hover:text-ink"
        )}
      >
        <Settings size={19} strokeWidth={2} />
      </Link>
    </header>
  );
}
