/**
 * GSMA LPA string helpers for RoamKit install UX (provider-neutral).
 * Format: LPA:1$<SM-DP+ address>$<activation code>
 *
 * Providers may also store a bare SM-DP+ host in `lpa` and the activation
 * code in `matching_id` — parse/resolve must support that shape.
 */

export type ParsedLpa = {
  raw: string;
  smdpAddress: string;
  activationCode: string;
};

function looksLikeSmdpHost(value: string): boolean {
  // Hostname (must include a dot) — not a GSMA body and not free text.
  return (
    Boolean(value) &&
    value.includes(".") &&
    !value.includes("$") &&
    !/\s/.test(value)
  );
}

export function parseLpa(lpa: string): ParsedLpa | null {
  const raw = lpa.trim();
  if (!raw) {
    return null;
  }
  const body = raw.replace(/^LPA:/i, "").trim();
  const parts = body.split("$");
  if (parts.length >= 3) {
    return {
      raw,
      smdpAddress: parts[1]?.trim() ?? "",
      activationCode: parts[2]?.trim() ?? "",
    };
  }
  if (looksLikeSmdpHost(body)) {
    return { raw, smdpAddress: body, activationCode: "" };
  }
  return { raw, smdpAddress: "", activationCode: "" };
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
    if (parsed?.smdpAddress) {
      const fromHost = buildLpaUri(
        parsed.smdpAddress,
        options.activationCode ?? "",
      );
      if (fromHost) {
        return fromHost;
      }
    }
  }
  return buildLpaUri(options.smdpAddress ?? "", options.activationCode ?? "");
}
