/** Display helpers for My eSIMs list/detail (order product snapshot). */

import type { AppliedPackage, Esim } from "@/lib/api";
import { formatDataMb } from "@/lib/esim/packages";

const MS_PER_DAY = 86_400_000;
const NEUTRAL_LABEL = "—";

export type EsimDetailsUsageInput = {
  total_mb?: number | null;
  is_unlimited?: boolean | null;
  expired_at?: string | null;
};

export type EsimDetailsLabels = {
  data: string;
  validity: string;
};

export function formatEsimStatus(status: string | null | undefined): string {
  if (!status) {
    return "eSIM";
  }
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatEsimDateTime(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function esimDestinationLabel(esim: Esim): string {
  const location = esim.location_title?.trim();
  if (location) {
    return location;
  }
  const title = esim.package_title?.trim();
  if (title) {
    return title;
  }
  return "eSIM";
}

export function esimValidityLabel(esim: Esim): string | null {
  if (esim.validity_days == null) {
    return null;
  }
  const days = esim.validity_days;
  return days === 1 ? "1 day" : `${days} days`;
}

function dataLabelFromLayer(
  isUnlimited: boolean | null | undefined,
  totalMb: number | null | undefined,
): string | null {
  if (isUnlimited === true) {
    return "Unlimited";
  }
  if (totalMb !== undefined && totalMb !== null && Number.isFinite(totalMb)) {
    return formatDataMb(totalMb);
  }
  return null;
}

function snapshotDataLabel(esim: Esim): string | null {
  const raw = esim.data_allowance?.trim();
  return raw ? raw : null;
}

function remainingDaysLabel(
  iso: string | null | undefined,
  nowMs: number,
): string | null {
  if (iso == null || iso === "") {
    return null;
  }
  const expiredMs = Date.parse(iso);
  if (Number.isNaN(expiredMs)) {
    return null;
  }
  const days = Math.max(0, Math.ceil((expiredMs - nowMs) / MS_PER_DAY));
  return days === 1 ? "1 day" : `${days} days`;
}

function snapshotValidityLabel(esim: Esim): string | null {
  return esimValidityLabel(esim);
}

/**
 * Headline Data / Validity for the eSIM details card.
 * Each field resolves independently: live usage → esim cache → purchase snapshot.
 * ``0`` is a real total (not missing). Invalid expiry never yields NaN / Invalid Date.
 */
export function esimDetailsLabels(
  esim: Esim,
  usage?: EsimDetailsUsageInput | null,
  now: number | Date = Date.now(),
): EsimDetailsLabels {
  const nowMs = typeof now === "number" ? now : now.getTime();
  const data =
    dataLabelFromLayer(usage?.is_unlimited, usage?.total_mb) ??
    dataLabelFromLayer(esim.usage_is_unlimited, esim.usage_total_mb) ??
    snapshotDataLabel(esim) ??
    NEUTRAL_LABEL;
  const validity =
    remainingDaysLabel(usage?.expired_at, nowMs) ??
    remainingDaysLabel(esim.usage_expired_at, nowMs) ??
    snapshotValidityLabel(esim) ??
    NEUTRAL_LABEL;
  return { data, validity };
}

/** Normalized note value (missing/undefined → empty string). */
export function esimNote(esim: Pick<Esim, "note"> | null | undefined): string {
  return esim?.note ?? "";
}

/** Truncate for list preview; empty input yields empty string. */
export function truncateNote(note: string | null | undefined, max = 48): string {
  const value = (note ?? "").trim();
  if (!value) {
    return "";
  }
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}…`;
}

export type EsimListSections = {
  active: Esim[];
  expired: Esim[];
  archived: Esim[];
};

function timeMs(iso: string | null | undefined): number {
  if (!iso) {
    return 0;
  }
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function compareNewestFirst(a: Esim, b: Esim): number {
  const byIssued =
    timeMs(b.issued_at ?? b.created_at) - timeMs(a.issued_at ?? a.created_at);
  if (byIssued !== 0) {
    return byIssued;
  }
  return b.id - a.id;
}

/**
 * Split My eSIMs into Active / Expired / Archived with locked sort order.
 * ``archived_at`` is presentation-only (never conflated with lifecycle status).
 */
export function partitionMyEsims(esims: Esim[]): EsimListSections {
  const active: Esim[] = [];
  const expired: Esim[] = [];
  const archived: Esim[] = [];

  for (const esim of esims) {
    if (esim.archived_at) {
      archived.push(esim);
    } else if (esim.status === "expired") {
      expired.push(esim);
    } else {
      active.push(esim);
    }
  }

  active.sort(compareNewestFirst);
  expired.sort((a, b) => {
    const byExpiry = timeMs(b.usage_expired_at) - timeMs(a.usage_expired_at);
    if (byExpiry !== 0) {
      return byExpiry;
    }
    return compareNewestFirst(a, b);
  });
  archived.sort((a, b) => {
    const byArchived = timeMs(b.archived_at) - timeMs(a.archived_at);
    if (byArchived !== 0) {
      return byArchived;
    }
    return b.id - a.id;
  });

  return { active, expired, archived };
}

/** Exact Action required pairs only. Unknown combinations fail closed. */
export type EsimActionRequiredReason =
  | "insufficient_funds"
  | "package_unavailable";

const ACTION_REQUIRED_SUBTITLE: Record<EsimActionRequiredReason, string> = {
  insufficient_funds: "Auto top-up paused · Insufficient funds",
  package_unavailable: "Auto top-up blocked · Package unavailable",
};

/**
 * Source of truth for Action required membership and list copy.
 * Archived never qualify. Expired eSIMs with an exact pair do.
 */
export function getEsimActionRequiredReason(
  esim: Esim,
): EsimActionRequiredReason | null {
  if (esim.archived_at) {
    return null;
  }
  const snapshot = esim.auto_topup;
  if (!snapshot || snapshot.enabled !== true) {
    return null;
  }
  if (
    snapshot.status === "paused" &&
    snapshot.reason === "insufficient_funds"
  ) {
    return "insufficient_funds";
  }
  if (
    snapshot.status === "blocked" &&
    snapshot.reason === "package_unavailable"
  ) {
    return "package_unavailable";
  }
  return null;
}

export function esimActionRequiredSubtitle(
  reason: EsimActionRequiredReason,
): string {
  return ACTION_REQUIRED_SUBTITLE[reason];
}

export function isActionRequiredEsim(esim: Esim): boolean {
  return getEsimActionRequiredReason(esim) !== null;
}

export function actionRequiredEsims(esims: Esim[]): Esim[] {
  return esims.filter(isActionRequiredEsim);
}

/** Canonical non-negative decimal with at most two fraction digits. */
const CANONICAL_PAID_USD = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

/**
 * Parse a customer-charge string into integer cents.
 * Rejects exponent, extra decimals, negatives, and implicit rounding.
 */
export function parsePaidUsdCents(value: string | null | undefined): number | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  if (!CANONICAL_PAID_USD.test(trimmed)) {
    return null;
  }
  const [whole, frac = ""] = trimmed.split(".");
  const wholeCents = Number(whole) * 100;
  const fracCents = Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(wholeCents) || !Number.isSafeInteger(fracCents)) {
    return null;
  }
  return wholeCents + fracCents;
}

function centsToPaidUsd(cents: number): string {
  const whole = Math.trunc(cents / 100);
  const frac = Math.abs(cents % 100);
  return `${whole}.${String(frac).padStart(2, "0")}`;
}

/**
 * Details Paid = sum of each package charge, or esim.paid_usd when none sum.
 * Does not dedupe by package id. Missing/invalid packages payload falls back.
 */
export function esimPaidTotal(
  packages: ReadonlyArray<Pick<AppliedPackage, "paid_usd">> | null | undefined,
  fallbackPaidUsd?: string | null,
): string | null {
  let cents = 0;
  let counted = 0;
  if (packages) {
    for (const row of packages) {
      const parsed = parsePaidUsdCents(row.paid_usd);
      if (parsed === null) {
        continue;
      }
      cents += parsed;
      counted += 1;
    }
  }
  if (counted > 0) {
    return centsToPaidUsd(cents);
  }
  const fallback = parsePaidUsdCents(fallbackPaidUsd);
  return fallback === null ? null : centsToPaidUsd(fallback);
}
