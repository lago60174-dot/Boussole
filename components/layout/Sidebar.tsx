"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Settings } from "lucide-react";
import { clsx } from "clsx";
import { NAV } from "./nav-items";

export function Sidebar({ displayName }: { displayName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-canvas-raised px-4 py-6 sm:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-compass text-white">
          <Compass size={18} strokeWidth={2.25} />
        </div>
        <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-ink">
          Boussole
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon, accent }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-line/70 text-ink" : "text-ink-soft hover:bg-line/40 hover:text-ink"
              )}
            >
              <Icon size={17} strokeWidth={2} style={{ color: active ? accent : undefined }} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
        <Link
          href="/settings"
          className={clsx(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/settings" ? "bg-line/70 text-ink" : "text-ink-soft hover:bg-line/40 hover:text-ink"
          )}
        >
          <Settings size={17} strokeWidth={2} />
          Paramètres
        </Link>
        <p className="truncate px-3 pt-2 text-xs text-ink-soft/70">{displayName}</p>
      </div>
    </aside>
  );
}
