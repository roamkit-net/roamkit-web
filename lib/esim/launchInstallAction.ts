/**
 * Central install-action launcher (Apple / Android LPA / future intents).
 * UI must not set window.location for install flows directly.
 *
 * Security: never log or telemetrize full LPA URIs, SM-DP+, or Activation Codes.
 */

export type InstallActionType =
  | "apple"
  | "android-lpa"
  | "android-intent"
  | "android-https";

export type LaunchInstallActionInput = {
  type: InstallActionType;
  uri: string;
};

export type DeepLinkAttemptResult = "success" | "failure" | "unknown";

/** Feature flag — default off until spike Decision Log says Ship B2. */
export function isAndroidLpaDeepLinkEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_ANDROID_LPA_DEEP_LINK?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

/**
 * Browser/environment gate for attempting a deep link.
 * Today: true when the feature flag is on (no Chrome hardcoding).
 */
export function canAttemptDeepLink(): boolean {
  return isAndroidLpaDeepLinkEnabled();
}

export function launchInstallAction(input: LaunchInstallActionInput): void {
  const uri = input.uri.trim();
  if (!uri || typeof window === "undefined") {
    return;
  }
  window.location.assign(uri);
}

/**
 * Heuristic: success if page becomes hidden within timeoutMs after attempt.
 * Does not inspect URI contents.
 */
export function observeDeepLinkAttempt(
  timeoutMs = 2500,
): Promise<DeepLinkAttemptResult> {
  if (typeof document === "undefined") {
    return Promise.resolve("unknown");
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: DeepLinkAttemptResult) => {
      if (settled) {
        return;
      }
      settled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearTimeout(timer);
      resolve(result);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        finish("success");
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    if (document.visibilityState === "hidden") {
      finish("success");
      return;
    }

    const timer = window.setTimeout(() => {
      finish(document.visibilityState === "hidden" ? "success" : "failure");
    }, timeoutMs);
  });
}
