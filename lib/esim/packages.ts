/** Display helpers for applied eSIM package history (not the buy catalog). */

import type { AppliedPackage } from "@/lib/api";

export type AppliedPackageGroup = {
  available: AppliedPackage[];
  previous: AppliedPackage[];
  unknown: AppliedPackage[];
};

export function partitionAppliedPackages(
  packages: AppliedPackage[],
): AppliedPackageGroup {
  const available: AppliedPackage[] = [];
  const previous: AppliedPackage[] = [];
  const unknown: AppliedPackage[] = [];

  for (const pkg of packages) {
    if (pkg.status === "active" || pkg.status === "not_active") {
      available.push(pkg);
    } else if (pkg.status === "expired" || pkg.status === "finished") {
      previous.push(pkg);
    } else {
      unknown.push(pkg);
    }
  }

  return { available, previous, unknown };
}

export function appliedPackageStatusLabel(status: string): string {
  if (status === "active") {
    return "Active";
  }
  if (status === "not_active") {
    return "Not active";
  }
  if (status === "expired" || status === "finished") {
    return "Expired";
  }
  return "Unknown";
}

export function appliedPackageKindLabel(kind: string): string {
  return kind === "esim" ? "eSIM" : "Top-up";
}

export function packageSpecLabel(pkg: AppliedPackage): string {
  const days =
    pkg.validity_days === 1 ? "1 day" : `${pkg.validity_days} days`;
  if (pkg.is_unlimited) {
    return `Unlimited · ${days}`;
  }
  const data = pkg.data_allowance.trim() || "—";
  return `${data} · ${days}`;
}

export function formatDataMb(mb: number): string {
  if (!Number.isFinite(mb)) {
    return "—";
  }
  const abs = Math.abs(mb);
  if (abs >= 1024) {
    const gb = mb / 1024;
    const rounded = Math.round(gb * 100) / 100;
    return `${formatNumber(rounded)} GB`;
  }
  return `${Math.round(mb)} MB`;
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(2).replace(/\.?0+$/, "");
}

export type UsageBarModel =
  | { kind: "unlimited" }
  | { kind: "unavailable" }
  | {
      kind: "metered";
      remainingMb: number;
      usedMb: number;
      totalMb: number;
      remainingPercent: number;
      usedPercent: number;
    };

export function usageBarModel(input: {
  remainingMb: number | null | undefined;
  totalMb: number | null | undefined;
  isUnlimited: boolean | null | undefined;
}): UsageBarModel {
  if (input.isUnlimited) {
    return { kind: "unlimited" };
  }
  const remaining = input.remainingMb;
  const total = input.totalMb;
  if (remaining == null || total == null || total <= 0) {
    return { kind: "unavailable" };
  }
  const used = Math.max(0, total - remaining);
  const remainingPercent = Math.round((remaining / total) * 100);
  return {
    kind: "metered",
    remainingMb: remaining,
    usedMb: used,
    totalMb: total,
    remainingPercent,
    usedPercent: 100 - remainingPercent,
  };
}

export function formatPaidAmount(
  paidUsd: string | null | undefined,
  currency: string | null | undefined,
): string {
  if (paidUsd == null || paidUsd === "") {
    return "—";
  }
  const amount = Number(paidUsd);
  if (!Number.isFinite(amount)) {
    return "—";
  }
  const code = (currency ?? "").trim() || "USD";
  return `$${amount.toFixed(2)} ${code}`;
}
