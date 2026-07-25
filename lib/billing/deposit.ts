import type { DepositRequest } from "@/types/billing";

import { isTerminalDepositStatus } from "@/lib/billing/poll";

export function isDepositVerified(deposit: DepositRequest): boolean {
  return deposit.status.trim().toLowerCase() === "completed";
}

export function isDepositFailed(deposit: DepositRequest): boolean {
  return deposit.status.trim().toLowerCase() === "failed";
}

export function isDepositPendingConfirmations(
  deposit: DepositRequest,
): boolean {
  return (
    deposit.status.trim().toLowerCase() === "pending" &&
    typeof deposit.confirmations === "number" &&
    typeof deposit.required_confirmations === "number"
  );
}

/** True when verify should keep polling (non-terminal / incomplete payload). */
export function shouldContinueDepositPoll(deposit: DepositRequest): boolean {
  if (!deposit || typeof deposit.status !== "string" || !deposit.status.trim()) {
    return true;
  }
  return !isTerminalDepositStatus(deposit.status);
}

export function formatDepositPendingMessage(
  deposit: DepositRequest,
  confirmationsRequired: number,
): string {
  if (isDepositPendingConfirmations(deposit)) {
    return `Waiting for confirmations (${deposit.confirmations}/${deposit.required_confirmations}).`;
  }
  return `Deposit is pending. About ${confirmationsRequired} confirmations are required.`;
}
