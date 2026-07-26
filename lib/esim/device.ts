/**
 * Client-side device class for eSIM install UX (RFC 002).
 */

export type InstallDeviceClass = "iphone" | "android" | "desktop";

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
