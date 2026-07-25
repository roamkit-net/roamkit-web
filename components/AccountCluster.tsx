import type { ReactNode } from "react";

const clusterClassName =
  "inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5 shadow-sm";

type AccountClusterProps = {
  children: ReactNode;
};

/**
 * Visual shell for the header account widget (balance + avatar).
 * Children remain independent controls; this only provides shared chrome.
 */
export function AccountCluster({ children }: AccountClusterProps) {
  return (
    <div data-testid="account-cluster" className={clusterClassName}>
      {children}
    </div>
  );
}

/** Loading placeholder that matches authenticated cluster geometry. */
export function AccountClusterSkeleton() {
  return (
    <div
      data-testid="account-cluster"
      data-state="loading"
      className={clusterClassName}
      aria-hidden="true"
    >
      <span
        data-testid="account-cluster-chip-skeleton"
        className="inline-flex h-10 w-[7.5rem] animate-pulse rounded-full bg-slate-100"
      />
      <AccountClusterDivider />
      <span
        data-testid="account-cluster-avatar-skeleton"
        className="inline-flex h-10 w-10 animate-pulse rounded-full bg-slate-200"
      />
    </div>
  );
}

/** Trailing separator between embedded BalanceChip and UserMenu. */
export function AccountClusterDivider() {
  return (
    <span
      data-testid="account-cluster-divider"
      className="mx-0.5 h-5 w-px shrink-0 self-center bg-slate-200"
      aria-hidden="true"
    />
  );
}
