import { billingTelemetry } from "@/lib/billing/telemetry";
import { newSpendIdempotencyKey } from "@/lib/orders/idempotency";
import {
  buildDepositRedirectUrl,
  computeMissingCredits,
  parseInsufficientCredits,
} from "@/lib/orders/insufficientCredits";
import { savePendingSpend } from "@/lib/orders/pendingSpend";

export type ShortfallDepositTarget =
  | { kind: "order"; packageId: string }
  | { kind: "topup"; packageId: string; esimId: string };

export type ShortfallDepositOutcome =
  | { status: "noop" }
  | { status: "can_afford" }
  | { status: "redirected" }
  | { status: "error"; message: string };

function currentPathWithSearch(): string {
  if (typeof window === "undefined") {
    return "/";
  }
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * Shared client shortfall → deposit hop (store + topup).
 * Caller owns inFlight / busy UI. Backend remains authority via 402 path.
 *
 * `refreshAndReadBalance` must return the balance *after* a refresh so the
 * affordability check is not stuck on a stale React state snapshot.
 */
export async function beginShortfallDeposit(options: {
  target: ShortfallDepositTarget;
  priceUsd: string;
  refreshAndReadBalance: () => Promise<string | null | undefined>;
  push: (href: string) => void;
}): Promise<ShortfallDepositOutcome> {
  let balance: string | null | undefined;
  try {
    balance = await options.refreshAndReadBalance();
  } catch {
    return {
      status: "error",
      message: "Unable to check your balance. Try again.",
    };
  }

  if (balance == null || balance === "") {
    return {
      status: "error",
      message: "Unable to check your balance. Try again.",
    };
  }

  const missing = computeMissingCredits(balance, options.priceUsd);
  if (missing === null) {
    return { status: "can_afford" };
  }

  const returnPath = currentPathWithSearch();
  const idempotencyKey = newSpendIdempotencyKey(
    options.target.kind === "order" ? "order" : "topup",
  );

  if (options.target.kind === "order") {
    savePendingSpend({
      kind: "order",
      packageId: options.target.packageId,
      idempotencyKey,
      returnPath,
    });
  } else {
    savePendingSpend({
      kind: "topup",
      esimId: options.target.esimId,
      packageId: options.target.packageId,
      idempotencyKey,
      returnPath,
    });
  }

  billingTelemetry.track("spend_insufficient_credits", {
    kind: options.target.kind,
    packageId: options.target.packageId,
    ...(options.target.kind === "topup"
      ? { esimId: options.target.esimId }
      : {}),
    missing_amount: missing,
    balance_before: balance,
    missing,
  });

  try {
    const href = buildDepositRedirectUrl({
      amount: missing || "25",
      returnPath,
    });
    options.push(href);
    return { status: "redirected" };
  } catch {
    return {
      status: "error",
      message: "Unable to open deposit. Try again.",
    };
  }
}

/**
 * 402 → deposit hop shared by order and topup hooks.
 * Replaces pending (latest intent) and uses API missing when present.
 */
export function redirectAfterInsufficientCredits(options: {
  target: ShortfallDepositTarget;
  idempotencyKey: string;
  err: unknown;
  push: (href: string) => void;
}): void {
  const info = parseInsufficientCredits(options.err);
  const amount = info?.missing || info?.required || "";
  const balanceBefore = info?.balance ?? null;
  const returnPath = currentPathWithSearch();

  if (options.target.kind === "order") {
    savePendingSpend({
      kind: "order",
      packageId: options.target.packageId,
      idempotencyKey: options.idempotencyKey,
      returnPath,
    });
  } else {
    savePendingSpend({
      kind: "topup",
      esimId: options.target.esimId,
      packageId: options.target.packageId,
      idempotencyKey: options.idempotencyKey,
      returnPath,
    });
  }

  billingTelemetry.track("spend_insufficient_credits", {
    kind: options.target.kind,
    packageId: options.target.packageId,
    ...(options.target.kind === "topup"
      ? { esimId: options.target.esimId }
      : {}),
    missing_amount: amount || null,
    balance_before: balanceBefore,
    missing: amount || null,
  });

  options.push(
    buildDepositRedirectUrl({
      amount: amount || "25",
      returnPath,
    }),
  );
}
