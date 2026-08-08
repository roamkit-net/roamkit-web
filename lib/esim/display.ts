/** Display helpers for My eSIMs list/detail (order product snapshot). */

import type { Esim } from "@/lib/api";

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
