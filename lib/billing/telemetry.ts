/**
 * Best-effort billing analytics surface.
 * Never throws to callers; never blocks the user flow. Swap the sink later
 * without touching deposit/spend UI.
 */

export type BillingTelemetryProps = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Frozen catalog of billing analytics event names (public API for dashboards).
 *
 * Do **not** rename existing members without an explicit analytics / dashboard
 * migration. Additive events are fine; emit them from the PR that lands the UX.
 *
 * Deposit usability (locked for deposit UX PR0+):
 * - existing: deposit_page_open, deposit_qr_generated, deposit_verify_*,
 *   deposit_poll_*
 * - PR0 additions (emit when UX lands): deposit_network_warning_seen,
 *   deposit_explorer_opened, deposit_retry_clicked, deposit_retry_success,
 *   deposit_pending_resumed, deposit_copy_address_clicked
 *
 * Prefer `deposit_verify_failed` + `code: "AMOUNT_MISMATCH"` over a parallel
 * mismatch event name.
 */
export type BillingTelemetryEvent =
  | "deposit_page_open"
  | "deposit_qr_generated"
  | "deposit_verify_clicked"
  | "deposit_verify_succeeded"
  | "deposit_verify_failed"
  | "deposit_poll_started"
  | "deposit_poll_stopped"
  | "deposit_poll_timed_out"
  | "deposit_network_warning_seen"
  | "deposit_explorer_opened"
  | "deposit_retry_clicked"
  | "deposit_retry_success"
  | "deposit_pending_resumed"
  | "deposit_copy_address_clicked"
  | "spend_insufficient_credits"
  | "spend_retry_after_deposit"
  | "purchase_confirm_opened"
  | "purchase_confirm_cancelled"
  | "purchase_confirm_confirmed"
  | "voucher_scan_started"
  | "voucher_scan_success"
  | "voucher_scan_failed"
  | "voucher_redeem_success"
  | "voucher_redeem_failed";

/**
 * Runtime list of locked deposit-related event names (catalog for tests / ops).
 * Keep in sync with the deposit_* members of {@link BillingTelemetryEvent}.
 */
export const DEPOSIT_TELEMETRY_EVENTS = [
  "deposit_page_open",
  "deposit_qr_generated",
  "deposit_verify_clicked",
  "deposit_verify_succeeded",
  "deposit_verify_failed",
  "deposit_poll_started",
  "deposit_poll_stopped",
  "deposit_poll_timed_out",
  "deposit_network_warning_seen",
  "deposit_explorer_opened",
  "deposit_retry_clicked",
  "deposit_retry_success",
  "deposit_pending_resumed",
  "deposit_copy_address_clicked",
] as const satisfies ReadonlyArray<BillingTelemetryEvent>;

export type DepositTelemetryEvent = (typeof DEPOSIT_TELEMETRY_EVENTS)[number];

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
