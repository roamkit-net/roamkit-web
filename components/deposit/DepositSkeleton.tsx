/** Loading placeholders for /me/deposit. */

function Pulse({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`}
      aria-hidden="true"
    />
  );
}

export function DepositSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading deposit details…</span>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Pulse className="h-3 w-28" />
        <Pulse className="mt-3 h-9 w-40" />
        <Pulse className="mt-6 h-4 w-36" />
        <Pulse className="mt-2 h-11 w-full max-w-xs" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Pulse className="h-5 w-40" />
        <Pulse className="mt-3 h-4 w-full max-w-md" />
        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <Pulse className="h-[180px] w-[180px] shrink-0" />
          <div className="min-w-0 flex-1 space-y-3">
            <Pulse className="h-3 w-28" />
            <Pulse className="h-4 w-full" />
            <Pulse className="h-4 w-24" />
            <Pulse className="mt-4 h-3 w-24" />
            <Pulse className="h-12 w-full" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Pulse className="h-5 w-44" />
        <Pulse className="mt-3 h-4 w-full max-w-lg" />
        <Pulse className="mt-6 h-11 w-full" />
        <Pulse className="mt-4 h-10 w-36" />
      </section>
    </div>
  );
}
