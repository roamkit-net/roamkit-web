/**
 * Android eSIM install guide content (Wave 1 SSOT).
 * UI must use GuideService — do not import ANDROID_GUIDES from components.
 */

export const GuideId = {
  SAMSUNG: "samsung",
  PIXEL: "pixel",
  OTHER: "other",
} as const;

export type AndroidGuideId = (typeof GuideId)[keyof typeof GuideId];

export type GuideStep = {
  title?: string;
  body: string;
};

export type InstallAction = "guide" | "qr";

/** API-shaped DTO; keep stable for a future REST content registry. */
export type AndroidGuide = {
  id: AndroidGuideId;
  title: string;
  order: number;
  supportedBrands: string[];
  steps: GuideStep[];
  /**
   * Guide content capabilities only (steps / QR copy).
   * Deep-link install is Android platform-level — not listed here.
   */
  installActions: InstallAction[];
  version?: number;
  updatedAt?: string;
};

export const ANDROID_GUIDES: readonly AndroidGuide[] = [
  {
    id: GuideId.SAMSUNG,
    title: "Samsung",
    order: 10,
    supportedBrands: ["Samsung", "Galaxy"],
    installActions: ["guide", "qr"],
    version: 1,
    updatedAt: "2026-07-27",
    steps: [
      {
        body: "Open Settings → Connections → SIM manager.",
      },
      {
        body: "Tap Add eSIM.",
      },
      {
        body: "Scan the QR code, or choose Enter activation code.",
      },
      {
        body: "If entering manually, use the SM-DP+ address and Activation Code shown below.",
      },
      {
        body: "Confirm and wait for the eSIM to download.",
      },
    ],
  },
  {
    id: GuideId.PIXEL,
    title: "Google Pixel",
    order: 20,
    supportedBrands: ["Google", "Pixel"],
    installActions: ["guide", "qr"],
    version: 1,
    updatedAt: "2026-07-27",
    steps: [
      {
        body: "Open Settings → Network & internet → SIMs.",
      },
      {
        body: "Tap Download a SIM instead or Add eSIM (wording varies by Android version).",
      },
      {
        body: "Scan the QR code, or enter details manually.",
      },
      {
        body: "If entering manually, use the SM-DP+ address and Activation Code shown below.",
      },
      {
        body: "Confirm and wait for the eSIM to download.",
      },
    ],
  },
  {
    id: GuideId.OTHER,
    title: "Other Android",
    order: 90,
    supportedBrands: ["Other", "Android"],
    installActions: ["guide", "qr"],
    version: 1,
    updatedAt: "2026-07-27",
    steps: [
      {
        body: "Open Settings → Network & internet (or Mobile network / Connections).",
      },
      {
        body: "Open SIMs, SIM manager, or Mobile network, then Add eSIM / Download SIM.",
      },
      {
        body: "Scan the QR code, or enter the SM-DP+ address and Activation Code manually.",
      },
      {
        body: "Confirm and wait for the eSIM to download. Menu names vary by manufacturer.",
      },
    ],
  },
] as const;
