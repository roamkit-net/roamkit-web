/**
 * Block explorer URLs derived from BillingConfig.chainId (never hardcode in UI).
 * Unknown chain ids return null — callers hide the link.
 */

type ExplorerConfig = {
  /** Short label for link text, e.g. Polygonscan */
  name: string;
  txUrl: (txHash: string) => string;
  addressUrl: (address: string) => string;
};

/** Known Polygon PoS explorers keyed by chain id from deposit-info. */
const EXPLORERS_BY_CHAIN_ID: Readonly<Record<number, ExplorerConfig>> = {
  137: {
    name: "Polygonscan",
    txUrl: (txHash) => `https://polygonscan.com/tx/${txHash}`,
    addressUrl: (address) => `https://polygonscan.com/address/${address}`,
  },
  80002: {
    name: "Amoy Polygonscan",
    txUrl: (txHash) => `https://amoy.polygonscan.com/tx/${txHash}`,
    addressUrl: (address) =>
      `https://amoy.polygonscan.com/address/${address}`,
  },
};

function normalizeTxHash(txHash: string): string | null {
  const trimmed = txHash.trim().toLowerCase();
  if (/^0x[0-9a-f]{64}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^[0-9a-f]{64}$/.test(trimmed)) {
    return `0x${trimmed}`;
  }
  return null;
}

export function explorerName(chainId: number): string | null {
  return EXPLORERS_BY_CHAIN_ID[chainId]?.name ?? null;
}

export function txExplorerUrl(
  chainId: number,
  txHash: string,
): string | null {
  const explorer = EXPLORERS_BY_CHAIN_ID[chainId];
  const hash = normalizeTxHash(txHash);
  if (!explorer || !hash) {
    return null;
  }
  return explorer.txUrl(hash);
}

export function addressExplorerUrl(
  chainId: number,
  address: string,
): string | null {
  const explorer = EXPLORERS_BY_CHAIN_ID[chainId];
  const trimmed = address.trim();
  if (!explorer || !/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
    return null;
  }
  return explorer.addressUrl(trimmed);
}
