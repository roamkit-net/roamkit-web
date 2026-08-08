/**
 * Auto Top-up v3 lifetime mapping (design lock).
 *
 * UI calendar date D (YYYY-MM-DD) ↔ API `active_until` exclusive UTC bound
 * at start of D+1 (00:00:00.000Z).
 */

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatUtcYmd(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

/** Map UI date D → exclusive ISO bound, or null when empty/invalid. */
export function activeUntilFromUiDate(dateYmd: string): string | null {
  const trimmed = dateYmd.trim();
  if (!trimmed) {
    return null;
  }
  const match = YMD.exec(trimmed);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  // Date.UTC rolls overflow (e.g. day+1 past month end) correctly.
  const exclusive = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
  if (Number.isNaN(exclusive.getTime())) {
    return null;
  }
  // Reject impossible calendar dates that rolled (e.g. 2026-02-31 → March).
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return exclusive.toISOString();
}

/** Map API exclusive bound → UI date D, or "" when null/invalid. */
export function uiDateFromActiveUntil(
  activeUntilIso: string | null | undefined,
): string {
  if (!activeUntilIso) {
    return "";
  }
  const bound = new Date(activeUntilIso);
  if (Number.isNaN(bound.getTime())) {
    return "";
  }
  const display = new Date(
    Date.UTC(
      bound.getUTCFullYear(),
      bound.getUTCMonth(),
      bound.getUTCDate() - 1,
    ),
  );
  return formatUtcYmd(
    display.getUTCFullYear(),
    display.getUTCMonth(),
    display.getUTCDate(),
  );
}
