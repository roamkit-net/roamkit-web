/**
 * Spike-only Android install URI variants for A/B probing on device.
 * Keep behind NEXT_PUBLIC_ANDROID_LPA_DEEP_LINK; remove losers after Decision Log.
 *
 * Security: never log or telemetrize full URIs, SM-DP+, or Activation Codes.
 *
 * Pass = system eSIM / Add eSIM UI. Play Store / “item not found” = fail
 * (even if the browser backgrounds).
 */

import type { InstallActionType } from "@/lib/esim/launchInstallAction";

export type AndroidInstallProbeId =
  | "android-universal"
  | "android-universal-raw"
  | "settings-network"
  | "settings-network-dashboard"
  | "intent-manage-sims"
  | "lpa";

export type AndroidInstallProbe = {
  id: AndroidInstallProbeId;
  /** Short button label shown in spike UI */
  label: string;
  /** Safe telemetry / matrix scheme token (no secrets) */
  scheme: "lpa" | "intent" | "https";
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
 * Google Android universal link (mirror of Apple esimsetup.apple.com).
 * @see https://esimsetup.android.com/esim_qrcode_provisioning?carddata=…
 */
export function buildAndroidUniversalLink(lpaUri: string): string | null {
  const canonical = canonicalLpa(lpaUri);
  if (!canonical) {
    return null;
  }
  return `https://esimsetup.android.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(canonical)}`;
}

/**
 * Build probe URIs from a resolved GSMA LPA string (`LPA:1$SM-DP+$code`).
 * Returns [] when input is empty.
 *
 * Round 3: Google universal HTTPS link + Samsung Settings bridges.
 * (Round 1–2: LPA:/intent packages → fail or Play Store miss.)
 */
export function buildAndroidInstallProbes(
  lpaUri: string,
): AndroidInstallProbe[] {
  const canonical = canonicalLpa(lpaUri);
  if (!canonical) {
    return [];
  }
  const universal = buildAndroidUniversalLink(canonical);
  if (!universal) {
    return [];
  }

  return [
    {
      id: "android-universal",
      label: "Install (Android universal)",
      scheme: "https",
      launchType: "android-https",
      uri: universal,
    },
    {
      id: "android-universal-raw",
      label: "Install (Android universal raw)",
      scheme: "https",
      launchType: "android-https",
      // Unencoded $ — some handlers expect QR-identical carddata.
      uri: `https://esimsetup.android.com/esim_qrcode_provisioning?carddata=${canonical}`,
    },
    {
      id: "settings-network",
      label: "Open (Network settings)",
      scheme: "intent",
      launchType: "android-intent",
      uri: "intent:#Intent;action=android.settings.NETWORK_OPERATOR_SETTINGS;package=com.android.settings;end",
    },
    {
      id: "settings-network-dashboard",
      label: "Open (Network dashboard)",
      scheme: "intent",
      launchType: "android-intent",
      uri: "intent:#Intent;action=android.intent.action.MAIN;component=com.android.settings/.Settings$NetworkDashboardActivity;end",
    },
    {
      id: "intent-manage-sims",
      label: "Open (Manage SIMs)",
      scheme: "intent",
      launchType: "android-intent",
      uri: "intent:#Intent;action=android.settings.MANAGE_ALL_SIM_PROFILES_SETTINGS;end",
    },
    {
      id: "lpa",
      label: "Install (LPA: baseline)",
      scheme: "lpa",
      launchType: "android-lpa",
      uri: canonical,
    },
  ];
}
