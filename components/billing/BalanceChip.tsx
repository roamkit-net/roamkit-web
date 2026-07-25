"use client";

import Link from "next/link";

import { useBilling } from "@/components/billing/useBilling";
import { formatCredits } from "@/lib/billing/format";

type BalanceChipProps = {
  /** Optional className for the outer link/span. */
  className?: string;
};

/**
 * Compact header credit balance. Uses useBilling only — never hardcodes token.
 * Hidden when billing is unavailable; skeleton while the first fetch is pending.
 */
export function BalanceChip({ className = "" }: BalanceChipProps) {
  const { balance, config, features, isLoading, isFetching } = useBilling();

  if (!features.billingEnabled && !isLoading) {
    return null;
  }

  const showSkeleton =
    isLoading || (features.billingEnabled && balance == null && isFetching);
  const symbol = config?.tokenSymbol ?? "credits";
  const label =
    balance != null ? `${formatCredits(balance)} ${symbol}` : `— ${symbol}`;

  const baseClass =
    "inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 " +
    className;

  if (showSkeleton) {
    return (
      <span
        className={
          "inline-flex h-10 w-[7.5rem] animate-pulse rounded-full border border-slate-200 bg-slate-100 " +
          className
        }
        aria-hidden="true"
      />
    );
  }

  return (
    <Link
      href="/me/deposit"
      className={baseClass}
      title="Deposit credits"
      aria-label={`Credit balance ${label}. Open deposit.`}
    >
      <span className="tabular-nums">{label}</span>
    </Link>
  );
}
