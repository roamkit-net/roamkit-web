import type { DepositRequest, VerifyDepositPayload } from "@/types/billing";

import { shouldContinueDepositPoll } from "@/lib/billing/deposit";
import { toBillingClientError, toBillingError } from "@/lib/billing/errors";
import {
  pollUntil,
  type PollUntilOptions,
} from "@/lib/billing/poll";
import { billingTelemetry } from "@/lib/billing/telemetry";

export type VerifyDepositFn = (
  payload: VerifyDepositPayload,
  signal?: AbortSignal,
) => Promise<DepositRequest>;

export type VerifyUntilSettledOptions = {
  signal?: AbortSignal;
  /** Called after every poll tick (including the first). */
  onUpdate?: (deposit: DepositRequest) => void;
  /** Test hooks / rare overrides for the shared poll helper. */
  poll?: Pick<
    PollUntilOptions<DepositRequest>,
    "intervalMs" | "timeoutMs" | "isDocumentVisible" | "delay" | "now"
  >;
};

/**
 * Call verify, then poll with the same payload until completed/failed,
 * abort, or the shared 5-minute timeout.
 */
export async function verifyDepositUntilSettled(
  verify: VerifyDepositFn,
  payload: VerifyDepositPayload,
  options: VerifyUntilSettledOptions = {},
): Promise<DepositRequest> {
  let pollStarted = false;

  try {
    const result = await pollUntil(
      async (signal) => {
        const deposit = await verify(payload, signal);
        options.onUpdate?.(deposit);
        return deposit;
      },
      {
        signal: options.signal,
        intervalMs: options.poll?.intervalMs,
        timeoutMs: options.poll?.timeoutMs,
        isDocumentVisible: options.poll?.isDocumentVisible,
        delay: options.poll?.delay,
        now: options.poll?.now,
        shouldStop: (deposit) => {
          if (shouldContinueDepositPoll(deposit)) {
            if (!pollStarted) {
              pollStarted = true;
              billingTelemetry.track("deposit_poll_started");
            }
            return false;
          }
          return true;
        },
      },
    );

    if (pollStarted) {
      billingTelemetry.track("deposit_poll_stopped", {
        status: result.status,
      });
    }

    return result;
  } catch (error) {
    const mapped = toBillingError(error);
    if (mapped.code === "POLL_TIMEOUT") {
      billingTelemetry.track("deposit_poll_timed_out");
    }
    throw toBillingClientError(error);
  }
}
