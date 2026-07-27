/**
 * Client-side device class for eSIM install UX (RFC 002).
 *
 * Device detection is a UX optimization only. Backend must never rely on it.
 * UI should expose only installation actions usable on the current device.
 *
 * Architecture: Android deep-link is a **platform** capability (universal link),
 * not an OEM guide flag. Manufacturer guides are optional help content only.
 */

export type InstallDeviceClass = "iphone" | "android" | "desktop";

export type AvailableInstallActions = {
  appleInstall: boolean;
  /** Platform-level Android universal eSIM link (not OEM-specific). */
  androidDeepLink: boolean;
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
 */
export function getAvailableInstallActions(
  device: InstallDeviceClass,
): AvailableInstallActions {
  return {
    appleInstall: device === "iphone",
    androidDeepLink: device === "android",
    qrInstall: true,
    manualInstall: true,
  };
}

export function canUseAppleInstallLink(device: InstallDeviceClass): boolean {
  return getAvailableInstallActions(device).appleInstall;
}

export function canUseAndroidDeepLink(device: InstallDeviceClass): boolean {
  return getAvailableInstallActions(device).androidDeepLink;
}
