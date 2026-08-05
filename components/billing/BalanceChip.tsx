"use client";

import Link from "next/link";

import { AccountClusterDivider } from "@/components/AccountCluster";
import { useBilling } from "@/components/billing/useBilling";
import { formatCredits } from "@/lib/billing/format";

const focusRingClass =
  "outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--app-background)]";

type BalanceChipProps = {
  /** Optional className for the outer link/span. */
  className?: string;
  /**
   * Flat style for AuthNav account cluster (no own border/shadow/bg).
   * When embedded, a trailing divider is rendered so it disappears with the chip.
   */
  embedded?: boolean;
};

/**
 * Compact header credit balance. Uses useBilling only — never hardcodes token.
 * Hidden when billing is unavailable; skeleton while the first fetch is pending.
 */
export function BalanceChip({
  className = "",
  embedded = false,
}: BalanceChipProps) {
  const { balance, config, features, isLoading, isFetching } = useBilling();

  if (!features.billingEnabled && !isLoading) {
    return null;
  }

  const showSkeleton =
    isLoading || (features.billingEnabled && balance == null && isFetching);
  const symbol = config?.tokenSymbol ?? "credits";
  const amount = balance != null ? formatCredits(balance) : "—";
  const label = `${amount} ${symbol}`;

  const baseClass = embedded
    ? `inline-flex h-10 min-w-[7rem] items-center justify-end rounded-full px-3 text-sm font-semibold tabular-nums text-slate-800 transition hover:bg-sky-50 hover:text-sky-900 ${focusRingClass} `
    : `inline-flex h-10 min-w-[7rem] items-center justify-end rounded-full border border-slate-200 bg-white px-3.5 text-sm font-semibold tabular-nums text-slate-800 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 ${focusRingClass} `;

  const divider = embedded ? <AccountClusterDivider /> : null;

  if (showSkeleton) {
    const skeletonClass = embedded
      ? "inline-flex h-10 min-w-[7rem] animate-pulse rounded-full bg-slate-100 "
      : "inline-flex h-10 min-w-[7rem] animate-pulse rounded-full border border-slate-200 bg-slate-100 ";

    return (
      <>
        <span
          data-testid="balance-chip-skeleton"
          className={skeletonClass + className}
          aria-hidden="true"
        />
        {divider}
      </>
    );
  }

  return (
    <>
      <Link
        href="/me/deposit"
        data-testid="balance-chip"
        className={baseClass + className}
        title="Deposit credits"
        aria-label={`Credit balance ${label}. Open deposit.`}
      >
        <span>{amount}</span>
        <span className="hidden sm:inline"> {symbol}</span>
      </Link>
      {divider}
    </>
  );
}
