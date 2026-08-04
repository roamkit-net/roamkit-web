/** Shared pulse placeholders for authenticated list/detail pages. */

function Pulse({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`}
      aria-hidden="true"
    />
  );
}

export function ListSkeleton({
  rows = 3,
  label = "Loading…",
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <Pulse className="h-3 w-20" />
          <Pulse className="mt-3 h-6 w-48" />
          <Pulse className="mt-2 h-4 w-36" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>
      <div>
        <Pulse className="h-3 w-24" />
        <Pulse className="mt-3 h-9 w-64 max-w-full" />
        <Pulse className="mt-3 h-4 w-full max-w-md" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Pulse className="h-5 w-28" />
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Pulse className="h-12 w-full" />
          <Pulse className="h-12 w-full" />
          <Pulse className="h-12 w-full" />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Pulse className="h-5 w-40" />
        <Pulse className="mt-4 h-4 w-full max-w-lg" />
        <Pulse className="mt-6 h-16 w-full" />
      </div>
    </div>
  );
}
