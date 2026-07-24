import { Compass } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-compass text-white">
            <Compass size={24} strokeWidth={2.25} />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-ink">
              Boussole
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Tâches, agenda et objectifs, alignés.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-canvas-raised p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
