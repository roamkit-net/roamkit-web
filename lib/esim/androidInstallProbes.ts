/**
 * Spike-only Android install URI variants for A/B probing on device.
 * Keep behind NEXT_PUBLIC_ANDROID_LPA_DEEP_LINK; remove losers after Decision Log.
 *
 * Security: never log or telemetrize full URIs, SM-DP+, or Activation Codes.
 */

import type { InstallActionType } from "@/lib/esim/launchInstallAction";

export type AndroidInstallProbeId =
  | "lpa"
  | "lpa-lower"
  | "intent"
  | "intent-noslash"
  | "intent-encoded"
  | "intent-phone";

export type AndroidInstallProbe = {
  id: AndroidInstallProbeId;
  /** Short button label shown in spike UI */
  label: string;
  /** Safe telemetry / matrix scheme token (no secrets) */
  scheme: "lpa" | "intent";
  launchType: InstallActionType;
  uri: string;
};

function lpaBody(lpaUri: string): string {
  return lpaUri.trim().replace(/^LPA:/i, "");
}

function canonicalLpa(lpaUri: string): string {
  const body = lpaBody(lpaUri);
  if (!body) {
    return "";
  }
  return `LPA:${body}`;
}

/**
 * Build probe URIs from a resolved GSMA LPA string (`LPA:1$SM-DP+$code`).
 * Returns [] when input is empty.
 */
export function buildAndroidInstallProbes(
  lpaUri: string,
): AndroidInstallProbe[] {
  const canonical = canonicalLpa(lpaUri);
  if (!canonical) {
    return [];
  }
  const body = lpaBody(canonical);
  const encodedBody = body.replace(/\$/g, "%24");

  return [
    {
      id: "lpa",
      label: "Install (LPA:)",
      scheme: "lpa",
      launchType: "android-lpa",
      uri: canonical,
    },
    {
      id: "lpa-lower",
      label: "Install (lpa:)",
      scheme: "lpa",
      launchType: "android-lpa",
      uri: `lpa:${body}`,
    },
    {
      id: "intent",
      label: "Install (intent://)",
      scheme: "intent",
      launchType: "android-intent",
      uri: `intent://${body}#Intent;scheme=lpa;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`,
    },
    {
      id: "intent-noslash",
      label: "Install (intent:)",
      scheme: "intent",
      launchType: "android-intent",
      uri: `intent:${body}#Intent;scheme=lpa;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`,
    },
    {
      id: "intent-encoded",
      label: "Install (intent:// %24)",
      scheme: "intent",
      launchType: "android-intent",
      uri: `intent://${encodedBody}#Intent;scheme=lpa;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`,
    },
    {
      id: "intent-phone",
      label: "Install (intent + phone)",
      scheme: "intent",
      launchType: "android-intent",
      uri: `intent://${body}#Intent;scheme=lpa;package=com.android.phone;action=android.intent.action.VIEW;end`,
    },
  ];
}
