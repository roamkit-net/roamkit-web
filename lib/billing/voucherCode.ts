/** Client-side voucher code normalize / validate (backend remains authoritative). */

const MAX_CODE_LENGTH = 64;

export function normalizeVoucherCode(raw: string): string {
  const normalized = raw.normalize("NFKC").replace(/\s+/g, "").toUpperCase();
  return normalized.trim();
}

export function isValidClientVoucherCode(raw: string): boolean {
  const code = normalizeVoucherCode(raw);
  return code.length > 0 && code.length <= MAX_CODE_LENGTH;
}

/** Extract voucher code from plain text or a URL with ?code=. */
export function extractCodeFromScan(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get("code");
    if (fromQuery) {
      return normalizeVoucherCode(fromQuery);
    }
  } catch {
    // Not a URL — treat as raw code.
  }
  return normalizeVoucherCode(trimmed);
}

export function sanitizeClipboardText(raw: string): string {
  return normalizeVoucherCode(raw.replace(/[\r\n]+/g, " "));
}
