/** Reown Cloud project ID — required for WalletConnect deposits. */
export const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() ?? "";

export function isWalletConnectConfigured(): boolean {
  return Boolean(projectId);
}

export const metadata = {
  name: "RoamKit",
  description: "Deposit Polygon USDT credits",
  url:
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://roamkit.net"),
  icons: ["/icons/android-icon-192x192.png"],
};
