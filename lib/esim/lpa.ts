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
