/**
 * Best-effort billing analytics surface.
 * Never throws to callers; never blocks the user flow. Swap the sink later
 * without touching deposit/spend UI.
 */

export type BillingTelemetryProps = Record<
  string,
  string | number | boolean | null | undefined
>;

export type BillingTelemetryEvent =
  | "deposit_page_open"
  | "deposit_qr_generated"
  | "deposit_verify_clicked"
  | "deposit_verify_succeeded"
  | "deposit_verify_failed"
  | "deposit_poll_started"
  | "deposit_poll_stopped"
  | "deposit_poll_timed_out"
  | "spend_insufficient_credits"
  | "spend_retry_after_deposit"
  | "purchase_confirm_opened"
  | "purchase_confirm_cancelled"
  | "purchase_confirm_confirmed";

export type BillingTelemetry = {
  track(
    event: BillingTelemetryEvent | (string & {}),
    props?: BillingTelemetryProps,
  ): void;
};

type TrackFn = BillingTelemetry["track"];

/**
 * Wrap any sink so telemetry failures never escape to the caller.
 * Used by the default no-op and by future analytics vendors.
 */
export function createBillingTelemetry(sink: TrackFn = () => undefined): BillingTelemetry {
  return {
    track(event, props) {
      try {
        sink(event, props);
      } catch {
        // best-effort: swallow sink errors
      }
    },
  };
}

/** No-op telemetry used until a real analytics vendor is wired. */
export const billingTelemetry: BillingTelemetry = createBillingTelemetry();
