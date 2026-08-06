/**
 * Remember scroll position across deposit → return hops on catalog / topup.
 */

const STORAGE_KEY = "roamkit_shortfall_scroll";

type ScrollPayload = {
  path: string;
  scrollY: number;
};

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function saveShortfallScroll(path: string, scrollY: number): void {
  if (!canUseSessionStorage()) {
    return;
  }
  const payload: ScrollPayload = { path, scrollY };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // best-effort
  }
}

/** Restore and clear when path matches; no-op otherwise. */
export function restoreShortfallScroll(path: string): void {
  if (!canUseSessionStorage()) {
    return;
  }
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    const record = parsed as Record<string, unknown>;
    if (record.path !== path || typeof record.scrollY !== "number") {
      return;
    }
    sessionStorage.removeItem(STORAGE_KEY);
    window.scrollTo({ top: record.scrollY });
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
