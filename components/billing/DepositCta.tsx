"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useBilling } from "@/components/billing/useBilling";
import { buttonClassName } from "@/components/ui/Button";

type DepositCtaProps = {
  /** Relative path after deposit (safe paths only — validated by deposit page). */
  returnPath?: string;
  /** Prefill deposit amount when known. */
  amount?: string;
  children?: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "link";
};

function buildHref(options: { amount?: string; returnPath?: string }): string {
  const params = new URLSearchParams();
  if (options.amount?.trim()) {
    params.set("amount", options.amount.trim());
  }
  if (options.returnPath?.startsWith("/") && !options.returnPath.startsWith("//")) {
    params.set("return", options.returnPath);
  }
  const query = params.toString();
  return query ? `/me/deposit?${query}` : "/me/deposit";
}

/**
 * Cap2.1: primary uses canonical Button classes.
 * secondary (sky outline) and link remain local — Cap2.1 API gaps (see ui/Button).
 */
const VARIANT_CLASS: Record<NonNullable<DepositCtaProps["variant"]>, string> = {
  primary: buttonClassName({ variant: "primary", size: "sm", tone: "app" }),
  secondary:
    "inline-flex items-center justify-center rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-900 hover:bg-sky-100",
  link: "text-sm font-medium text-sky-700 hover:text-sky-800",
};

/**
 * Deposit credits CTA. Hidden when billing is not enabled for the session.
 */
export function DepositCta({
  returnPath,
  amount,
  children = "Deposit credits",
  className = "",
  variant = "secondary",
}: DepositCtaProps) {
  const { features, isLoading } = useBilling();

  if (!features.billingEnabled && !isLoading) {
    return null;
  }

  return (
    <Link
      href={buildHref({ amount, returnPath })}
      className={`${VARIANT_CLASS[variant]} ${className}`.trim()}
    >
      {children}
    </Link>
  );
}
