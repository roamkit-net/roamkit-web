/**
 * GSMA LPA string helpers for RoamKit install UX (provider-neutral).
 * Format: LPA:1$<SM-DP+ address>$<activation code>
 */

export type ParsedLpa = {
  raw: string;
  smdpAddress: string;
  activationCode: string;
};

export function parseLpa(lpa: string): ParsedLpa | null {
  const raw = lpa.trim();
  if (!raw) {
    return null;
  }
  const body = raw.replace(/^LPA:/i, "");
  const parts = body.split("$");
  if (parts.length < 3) {
    return { raw, smdpAddress: "", activationCode: "" };
  }
  return {
    raw,
    smdpAddress: parts[1]?.trim() ?? "",
    activationCode: parts[2]?.trim() ?? "",
  };
}

/** Build a GSMA LPA URI from SM-DP+ and Activation Code. */
export function buildLpaUri(
  smdpAddress: string,
  activationCode: string,
): string | null {
  const smdp = smdpAddress.trim();
  const code = activationCode.trim();
  if (!smdp || !code) {
    return null;
  }
  return `LPA:1$${smdp}$${code}`;
}

/**
 * Prefer a valid existing LPA string; otherwise build from parts.
 * Never log or send the returned URI to telemetry.
 */
export function resolveLpaUri(options: {
  lpa?: string | null;
  smdpAddress?: string | null;
  activationCode?: string | null;
}): string | null {
  const existing = options.lpa?.trim() ?? "";
  if (existing) {
    const parsed = parseLpa(existing);
    if (parsed?.smdpAddress && parsed.activationCode) {
      return /^LPA:/i.test(existing) ? existing : `LPA:${existing}`;
    }
  }
  return buildLpaUri(options.smdpAddress ?? "", options.activationCode ?? "");
}
