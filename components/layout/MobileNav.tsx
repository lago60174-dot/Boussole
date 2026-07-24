"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { NAV } from "./nav-items";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-canvas-raised pb-[env(safe-area-inset-bottom)] sm:hidden">
      {NAV.map(({ href, label, icon: Icon, accent }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-ink-soft"
          >
            <Icon
              size={19}
              strokeWidth={2}
              style={{ color: active ? accent : undefined }}
              className={clsx(!active && "text-ink-soft")}
            />
            <span className={clsx(active ? "text-ink" : "text-ink-soft")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
