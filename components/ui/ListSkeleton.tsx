/** Shared pulse placeholders for authenticated list/detail pages. */

import { Card, CardSection } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

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
          <Skeleton variant="line" className="h-3 w-20" />
          <Skeleton className="mt-3 h-6 w-48" />
          <Skeleton variant="line" className="mt-2 h-4 w-36" />
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
        <Skeleton variant="line" className="h-3 w-24" />
        <Skeleton className="mt-3 h-9 w-64 max-w-full" />
        <Skeleton variant="line" className="mt-3 h-4 w-full max-w-md" />
      </div>
      <Card>
        <CardSection>
          <Skeleton className="h-5 w-28" />
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardSection>
      </Card>
      <Card>
        <CardSection>
          <Skeleton className="h-5 w-40" />
          <Skeleton variant="line" className="mt-4 h-4 w-full max-w-lg" />
          <Skeleton className="mt-6 h-16 w-full" />
        </CardSection>
      </Card>
    </div>
  );
}
