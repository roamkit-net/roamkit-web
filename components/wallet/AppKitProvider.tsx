"use client";

import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { createAppKit } from "@reown/appkit/react";
import { polygon } from "@reown/appkit/networks";
import type { ReactNode } from "react";

import { metadata, projectId } from "@/config/appkit";

let appKitInitialized = false;

function ensureAppKit() {
  if (appKitInitialized || !projectId) {
    return;
  }
  createAppKit({
    adapters: [new EthersAdapter()],
    projectId,
    networks: [polygon],
    defaultNetwork: polygon,
    metadata,
    features: {
      analytics: false,
      email: false,
      socials: false,
      swaps: false,
      onramp: false,
    },
    themeMode: "light",
  });
  appKitInitialized = true;
}

type AppKitProviderProps = {
  children: ReactNode;
};

/**
 * Initializes Reown AppKit (ethers adapter) for the deposit WalletConnect flow.
 * Mounted on /me/deposit when walletconnect_enabled — not in the root layout.
 */
export function AppKitProvider({ children }: AppKitProviderProps) {
  ensureAppKit();
  return children;
}
