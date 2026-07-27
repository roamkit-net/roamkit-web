/**
 * Android install deep links for RoamKit setup UX.
 *
 * Architecture: deep-link capability is Android **platform**-level (not OEM guide).
 * Product CTA: Google Android universal HTTPS link (esimsetup.android.com).
 *
 * Security: never log or telemetrize full URIs, SM-DP+, or Activation Codes.
 */

import type { InstallActionType } from "@/lib/esim/launchInstallAction";

export type AndroidInstallActionId = "android-universal";

export type AndroidInstallAction = {
  id: AndroidInstallActionId;
  label: string;
  scheme: "https";
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

/** Single product Install eSIM action when LPA can be resolved. */
export function buildAndroidInstallAction(
  lpaUri: string,
): AndroidInstallAction | null {
  const universal = buildAndroidUniversalLink(lpaUri);
  if (!universal) {
    return null;
  }
  return {
    id: "android-universal",
    label: "Install eSIM",
    scheme: "https",
    launchType: "android-https",
    uri: universal,
  };
}
