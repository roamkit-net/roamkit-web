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
  | "lpa"
  | "intent"
  | "intent-samsung"
  | "intent-euicc"
  | "intent-euicc-activate"
  | "intent-manage-sims";

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

function intentLpa(body: string, packageName: string): string {
  return `intent://${body}#Intent;scheme=lpa;package=${packageName};action=android.intent.action.VIEW;end`;
}

/**
 * Build probe URIs from a resolved GSMA LPA string (`LPA:1$SM-DP+$code`).
 * Returns [] when input is empty.
 *
 * Round 2 (after LPA: / bare intent:// failed; intent+phone → Play Store miss):
 * try OEM eUICC / SIM packages and activation settings actions.
 */
export function buildAndroidInstallProbes(
  lpaUri: string,
): AndroidInstallProbe[] {
  const canonical = canonicalLpa(lpaUri);
  if (!canonical) {
    return [];
  }
  const body = lpaBody(canonical);

  return [
    {
      id: "lpa",
      label: "Install (LPA:)",
      scheme: "lpa",
      launchType: "android-lpa",
      uri: canonical,
    },
    {
      id: "intent",
      label: "Install (intent://)",
      scheme: "intent",
      launchType: "android-intent",
      uri: `intent://${body}#Intent;scheme=lpa;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`,
    },
    {
      id: "intent-samsung",
      label: "Install (Samsung SIM UI)",
      scheme: "intent",
      launchType: "android-intent",
      uri: intentLpa(body, "com.samsung.android.app.telephonyui"),
    },
    {
      id: "intent-euicc",
      label: "Install (Google eUICC)",
      scheme: "intent",
      launchType: "android-intent",
      uri: intentLpa(body, "com.google.android.euicc"),
    },
    {
      id: "intent-euicc-activate",
      label: "Install (eUICC activate)",
      scheme: "intent",
      launchType: "android-intent",
      uri: "intent:#Intent;action=android.telephony.euicc.action.START_EUICC_ACTIVATION;end",
    },
    {
      id: "intent-manage-sims",
      label: "Install (Manage SIMs)",
      scheme: "intent",
      launchType: "android-intent",
      uri: "intent:#Intent;action=android.settings.MANAGE_ALL_SIM_PROFILES_SETTINGS;end",
    },
  ];
}
