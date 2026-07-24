import { clsx } from "clsx";

export function Badge({
  children,
  color = "var(--color-ink-soft)",
  soft = "var(--color-line)",
  className,
}: {
  children: React.ReactNode;
  color?: string;
  soft?: string;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        className
      )}
      style={{ color, backgroundColor: soft }}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  color = "var(--color-compass)",
  track = "var(--color-line)",
  className,
}: {
  value: number; // 0..1
  color?: string;
  track?: string;
  className?: string;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      className={clsx("h-1.5 w-full overflow-hidden rounded-full", className)}
      style={{ backgroundColor: track }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
