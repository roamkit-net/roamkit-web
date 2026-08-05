/** Loading placeholders for /me/deposit. */

import { Card, CardSection } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function DepositSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading deposit details…</span>

      <Card as="section">
        <CardSection>
          <Skeleton variant="line" className="h-3 w-28" />
          <Skeleton className="mt-3 h-9 w-40" />
          <Skeleton variant="line" className="mt-6 h-4 w-36" />
          <Skeleton className="mt-2 h-11 w-full max-w-xs" />
        </CardSection>
      </Card>

      <Card as="section">
        <CardSection>
          <Skeleton className="h-5 w-40" />
          <Skeleton variant="line" className="mt-3 h-4 w-full max-w-md" />
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Skeleton className="h-[180px] w-[180px] shrink-0" />
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton variant="line" className="h-3 w-28" />
              <Skeleton variant="line" className="h-4 w-full" />
              <Skeleton variant="line" className="h-4 w-24" />
              <Skeleton variant="line" className="mt-4 h-3 w-24" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </CardSection>
      </Card>

      <Card as="section">
        <CardSection>
          <Skeleton className="h-5 w-44" />
          <Skeleton variant="line" className="mt-3 h-4 w-full max-w-lg" />
          <Skeleton className="mt-6 h-11 w-full" />
          <Skeleton className="mt-4 h-10 w-36" />
        </CardSection>
      </Card>
    </div>
  );
}
