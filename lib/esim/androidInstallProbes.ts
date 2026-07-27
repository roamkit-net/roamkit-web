/**
 * Android install deep links for RoamKit setup UX.
 *
 * Product choice (spike Decision Log, Z Fold 6 2026-07-27):
 * - Primary: Google Android universal HTTPS link (esimsetup.android.com)
 * - Secondary: Network dashboard Settings bridge (Connections → SIM manager)
 *
 * Losers removed: bare LPA:, intent:// packages, Play Store package targets,
 * universal-raw duplicate, NETWORK_OPERATOR_SETTINGS, Manage SIMs.
 *
 * Security: never log or telemetrize full URIs, SM-DP+, or Activation Codes.
 */

import type { InstallActionType } from "@/lib/esim/launchInstallAction";

export type AndroidInstallActionId =
  | "android-universal"
  | "settings-network-dashboard";

export type AndroidInstallAction = {
  id: AndroidInstallActionId;
  label: string;
  scheme: "https" | "intent";
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
 * Opens native “Set up eSIM” when GMS / SIM Manager supports it.
 */
export function buildAndroidUniversalLink(lpaUri: string): string | null {
  const canonical = canonicalLpa(lpaUri);
  if (!canonical) {
    return null;
  }
  return `https://esimsetup.android.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(canonical)}`;
}

/** Opens Samsung/Android Connections (Veze) — SIM manager is one tap away. */
export const ANDROID_NETWORK_DASHBOARD_URI =
  "intent:#Intent;action=android.intent.action.MAIN;component=com.android.settings/.Settings$NetworkDashboardActivity;end";

/**
 * Product install actions for guides with `deep-link` capability.
 * Primary first; Settings bridge second.
 */
export function buildAndroidInstallActions(
  lpaUri: string,
): AndroidInstallAction[] {
  const universal = buildAndroidUniversalLink(lpaUri);
  if (!universal) {
    return [];
  }

  return [
    {
      id: "android-universal",
      label: "Install eSIM",
      scheme: "https",
      launchType: "android-https",
      uri: universal,
    },
    {
      id: "settings-network-dashboard",
      label: "Open Connections settings",
      scheme: "intent",
      launchType: "android-intent",
      uri: ANDROID_NETWORK_DASHBOARD_URI,
    },
  ];
}
