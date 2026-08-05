/**
 * Centralized deposit UI copy (i18n-ready).
 * Components import from here — no ad-hoc user-facing string literals for
 * deposit UX. Swap this module for next-intl (or similar) later without
 * touching layout.
 */

export const depositCopy = {
  pageTitle: "Deposit",
  pageDescriptionWithWallet:
    "Add prepaid credits. Send on-chain via QR / wallet, or paste an exchange withdrawal TXID.",
  pageDescriptionWithoutWallet:
    "Add prepaid credits. Send on-chain via QR, or paste an exchange withdrawal TXID.",

  networkWarningTitle: "Polygon PoS only",
  networkWarningLead: (tokenSymbol: string, chainId: number) =>
    `Send ${tokenSymbol} on Polygon PoS only (chain ${chainId}). Funds sent on other networks or as other tokens will not be credited.`,
  networkWarningDontEthereum: "Do not use Ethereum ERC-20",
  networkWarningDontTron: "Do not use TRON TRC-20",
  networkWarningDontBsc: "Do not use BNB Smart Chain",

  qrHeading: "Send using QR",
  qrDescription: (tokenSymbol: string, chainId: number) =>
    `Scan with your wallet to send ${tokenSymbol} on Polygon PoS (chain ${chainId}). Enter an amount above to include it in the payment request.`,
  qrUnavailable: "Deposit address unavailable",
  qrPlatformWalletLabel: "Platform wallet",
  qrPaymentUriLabel: "Payment request URI",
  copyAddress: "Copy address",
  copyUri: "Copy URI",
  copied: "Copied",

  walletHeading: "Pay with wallet",
  walletDescription: (tokenSymbol: string) =>
    `Connect a wallet and send ${tokenSymbol}. After you approve the transfer we capture the transaction hash and verify it with RoamKit.`,
  walletMisconfiguredHeading: "Pay with wallet",
  walletMisconfiguredBody:
    "Wallet deposits are enabled on the API, but this web build is missing a WalletConnect project id. Use Send using QR or Deposit from exchange instead.",

  cexHeading: "Deposit from exchange",
  cexDescription: (tokenSymbol: string) =>
    `Withdraw ${tokenSymbol} to the platform wallet from an exchange, then paste the transaction hash here.`,
  cexTxHashLabel: "Transaction hash (TXID)",
  cexVerify: "Verify deposit",
  cexVerifying: "Verifying…",

  cexVerified: "Deposit verified. Credits will appear in your balance.",
  cexFailedFallback:
    "Deposit could not be verified. Check the TXID and network.",
  walletVerified: "Deposit verified. Credits added to your balance.",
  walletFailedFallback: "Wallet deposit could not be verified.",

  amountMismatchTitle: "Amount does not match the on-chain transfer",
  amountMismatchBody: (tokenSymbol: string, onChainAmount: string) =>
    `Exchanges sometimes deduct a fee. The blockchain received ${onChainAmount} ${tokenSymbol}. Enter that exact amount and retry — we will not invent credits.`,
  amountMismatchReceivedLabel: "Received on-chain",
  amountMismatchRetry: (amount: string, tokenSymbol: string) =>
    `Retry with ${amount} ${tokenSymbol}`,

  viewOnExplorer: (explorerName: string) => `View on ${explorerName} →`,
  viewOnExplorerAria: (explorerName: string) =>
    `View transaction on ${explorerName}`,
} as const;
