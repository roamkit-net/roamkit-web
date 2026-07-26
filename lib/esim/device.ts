/**
 * Client-side device class for eSIM install UX (RFC 002).
 *
 * Device detection is a UX optimization only. Backend must never rely on it.
 * UI should expose only installation actions usable on the current device.
 */

export type InstallDeviceClass = "iphone" | "android" | "desktop";

export type AvailableInstallActions = {
  appleInstall: boolean;
  qrInstall: boolean;
  manualInstall: boolean;
};

export function detectInstallDevice(
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : "",
): InstallDeviceClass {
  const ua = userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return "iphone";
  }
  if (/Android/i.test(ua)) {
    return "android";
  }
  return "desktop";
}

/**
 * Which install CTAs are usable on this device class.
 * Future Android intents / Apple Universal Links: update here only.
 */
export function getAvailableInstallActions(
  device: InstallDeviceClass,
): AvailableInstallActions {
  return {
    appleInstall: device === "iphone",
    qrInstall: true,
    manualInstall: true,
  };
}

export function canUseAppleInstallLink(device: InstallDeviceClass): boolean {
  return getAvailableInstallActions(device).appleInstall;
}
