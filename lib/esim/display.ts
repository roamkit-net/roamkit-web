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
