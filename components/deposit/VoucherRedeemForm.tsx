"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { redeemVoucher } from "@/lib/billing/client";
import { formatCredits } from "@/lib/billing/format";
import { billingKeys } from "@/lib/billing/keys";
import { billingTelemetry } from "@/lib/billing/telemetry";
import {
  extractCodeFromScan,
  isValidClientVoucherCode,
  normalizeVoucherCode,
  sanitizeClipboardText,
} from "@/lib/billing/voucherCode";
import {
  QR_INVALID_MESSAGE,
  toVoucherUiError,
  type VoucherUiError,
} from "@/lib/billing/voucherErrors";
import { Card, CardSection } from "@/components/ui/Card";
import { buttonClassName } from "@/components/ui/Button";
import type { BillingBalance, VoucherRedeemResponse } from "@/types/billing";

export type VoucherRedeemStatus = "idle" | "redeeming" | "success" | "error";

/** Allowed transitions — document + enforce in setStatus helpers. */
const ALLOWED: Record<VoucherRedeemStatus, readonly VoucherRedeemStatus[]> = {
  idle: ["redeeming"],
  redeeming: ["success", "error"],
  success: ["idle"],
  error: ["redeeming"],
};

export type VoucherRedeemFormProps = {
  enabled: boolean;
  initialCode?: string;
  /** From deposit-info / BillingConfig — never hardcode. */
  tokenSymbol: string;
  onSuccess?: (result: VoucherRedeemResponse) => void;
  /** Injected for tests / DepositPage balance refresh. */
  refreshBalance?: () => Promise<void>;
};

function canScanQr(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const secure =
    window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  return Boolean(secure && navigator.mediaDevices?.getUserMedia);
}

export function VoucherRedeemForm({
  enabled,
  initialCode = "",
  tokenSymbol,
  onSuccess,
  refreshBalance,
}: VoucherRedeemFormProps) {
  const queryClient = useQueryClient();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const scannerHostRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);
  const scannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void | Promise<void>;
  } | null>(null);
  const scanFailedOnceRef = useRef(false);

  const [code, setCode] = useState(() =>
    initialCode ? normalizeVoucherCode(initialCode) : "",
  );
  const [status, setStatusRaw] = useState<VoucherRedeemStatus>("idle");
  const [error, setError] = useState<VoucherUiError | null>(null);
  const [success, setSuccess] = useState<VoucherRedeemResponse | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerNote, setScannerNote] = useState<string | null>(null);
  const [pasteAvailable, setPasteAvailable] = useState(false);
  const [scanCapable, setScanCapable] = useState(false);

  const setStatus = useCallback((next: VoucherRedeemStatus) => {
    setStatusRaw((prev) => {
      if (prev === next) {
        return prev;
      }
      if (!ALLOWED[prev].includes(next)) {
        console.warn(`Invalid voucher status transition ${prev} → ${next}`);
        return prev;
      }
      return next;
    });
  }, []);

  /** Enter redeeming from idle/error; from success, idle first (allowed table). */
  const goRedeeming = useCallback(() => {
    setStatusRaw((prev) => {
      let current: VoucherRedeemStatus = prev;
      if (current === "success") {
        current = "idle";
      }
      if (current === "redeeming") {
        return "redeeming";
      }
      if (!ALLOWED[current].includes("redeeming")) {
        console.warn(`Invalid voucher status transition ${prev} → redeeming`);
        return prev;
      }
      return "redeeming";
    });
  }, []);

  const destroyScanner = useCallback(async (): Promise<void> => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) {
      return;
    }
    try {
      await scanner.stop();
    } catch {
      // already stopped
    }
    try {
      await scanner.clear();
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    setScanCapable(canScanQr());
    setPasteAvailable(
      typeof navigator !== "undefined" &&
        typeof navigator.clipboard?.readText === "function",
    );
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      void destroyScanner();
    };
  }, [destroyScanner]);

  useEffect(() => {
    if (initialCode) {
      setCode(normalizeVoucherCode(initialCode));
    }
  }, [initialCode]);

  useEffect(() => {
    if (status === "success") {
      successRef.current?.focus();
    } else if (status === "error" || !scannerOpen) {
      inputRef.current?.focus();
    }
  }, [status, scannerOpen]);

  const closeScanner = useCallback(async () => {
    setScannerOpen(false);
    setScannerNote(null);
    await destroyScanner();
    inputRef.current?.focus();
  }, [destroyScanner]);

  useEffect(() => {
    if (!scannerOpen) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        void closeScanner();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scannerOpen, closeScanner]);

  const applyBalanceUpdate = useCallback(
    async (result: VoucherRedeemResponse) => {
      queryClient.setQueryData<BillingBalance>(billingKeys.balance, {
        balance: result.balance,
      });
      if (refreshBalance) {
        try {
          await refreshBalance();
        } catch {
          await queryClient.invalidateQueries({
            queryKey: billingKeys.balance,
          });
          try {
            await refreshBalance();
          } catch {
            // leave optimistic balance
          }
        }
      } else {
        await queryClient.invalidateQueries({ queryKey: billingKeys.balance });
      }
    },
    [queryClient, refreshBalance],
  );

  const runRedeem = useCallback(
    async (rawCode: string) => {
      if (!enabled) {
        return;
      }
      if (pendingRef.current) {
        return pendingRef.current;
      }

      const normalized = normalizeVoucherCode(rawCode);
      if (!isValidClientVoucherCode(normalized)) {
        if (!mountedRef.current) {
          return;
        }
        setCode(normalized);
        setSuccess(null);
        setError({
          code: "CLIENT_INVALID",
          category: "validation",
          message: "Enter a valid voucher code.",
          retryable: false,
        });
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setCode(normalized);
      setError(null);
      setSuccess(null);
      goRedeeming();

      const work = (async () => {
        try {
          const result = await redeemVoucher(normalized, {
            signal: controller.signal,
          });
          if (controller.signal.aborted || !mountedRef.current) {
            return;
          }
          setSuccess(result);
          setStatus("success");
          billingTelemetry.track("voucher_redeem_success", {
            category: "business",
          });
          await applyBalanceUpdate(result);
          onSuccess?.(result);
          setCode("");
        } catch (err) {
          if (controller.signal.aborted || !mountedRef.current) {
            return;
          }
          const mapped = toVoucherUiError(err);
          setError(mapped);
          setStatus("error");
          billingTelemetry.track("voucher_redeem_failed", {
            category: mapped.category,
            code: mapped.code,
          });
        } finally {
          pendingRef.current = null;
        }
      })();

      pendingRef.current = work;
      return work;
    },
    [applyBalanceUpdate, enabled, goRedeeming, onSuccess, setStatus],
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await runRedeem(code);
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      setCode(sanitizeClipboardText(text));
      setError(null);
      setSuccess(null);
      if (status === "success") {
        setStatus("idle");
      }
    } catch (err) {
      if (
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "SecurityError")
      ) {
        setPasteAvailable(false);
        return;
      }
      setScannerNote("Could not read clipboard.");
    }
  }

  async function handleOpenScanner() {
    if (!canScanQr()) {
      setScannerNote("Camera unavailable. Continue with manual entry.");
      return;
    }
    setScannerOpen(true);
    setScannerNote(null);
    scanFailedOnceRef.current = false;
    billingTelemetry.track("voucher_scan_started");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      await destroyScanner();
      const hostId = "voucher-qr-reader";
      if (!scannerHostRef.current) {
        return;
      }
      scannerHostRef.current.id = hostId;
      const scanner = new Html5Qrcode(hostId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          const extracted = extractCodeFromScan(decoded);
          billingTelemetry.track("voucher_scan_success");
          void (async () => {
            await closeScanner();
            if (!isValidClientVoucherCode(extracted)) {
              if (!mountedRef.current) {
                return;
              }
              // Stay idle — client validation is not an API error status.
              setError({
                code: "QR_INVALID",
                category: "validation",
                message: QR_INVALID_MESSAGE,
                retryable: false,
              });
              return;
            }
            setCode(extracted);
            await runRedeem(extracted);
          })();
        },
        () => {
          if (!scanFailedOnceRef.current) {
            scanFailedOnceRef.current = true;
            billingTelemetry.track("voucher_scan_failed", {
              category: "validation",
            });
          }
        },
      );
    } catch {
      billingTelemetry.track("voucher_scan_failed", { category: "unknown" });
      setScannerNote("Camera unavailable. Continue with manual entry.");
      await closeScanner();
    }
  }

  if (!enabled) {
    return null;
  }

  const busy = status === "redeeming";

  return (
    <Card as="section" data-testid="voucher-redeem-section">
      <CardSection>
        <h2 className="text-lg font-semibold text-slate-900">Redeem voucher</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter a gift or promo code, or scan a QR code to add credits.
        </p>

        {status === "success" && success ? (
          <div
            ref={successRef}
            tabIndex={-1}
            role="status"
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 outline-none"
            data-testid="voucher-redeem-success"
          >
            {success.replay ? (
              <>
                <p className="font-semibold">Already redeemed</p>
                <p className="mt-1 text-sm">
                  You already redeemed this voucher. Your balance was not
                  changed.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">Voucher redeemed</p>
                <p className="mt-1 text-sm tabular-nums">
                  +{formatCredits(success.credited)} {tokenSymbol}
                </p>
              </>
            )}
            <p className="mt-1 text-sm tabular-nums text-emerald-900/80">
              Current balance: {formatCredits(success.balance)} {tokenSymbol}
            </p>
            <button
              type="button"
              className="mt-3 text-sm font-medium text-emerald-900 underline"
              onClick={() => {
                setSuccess(null);
                setStatus("idle");
                inputRef.current?.focus();
              }}
            >
              Redeem another
            </button>
          </div>
        ) : null}

        <form
          className="mt-4 flex flex-col gap-3 md:flex-row md:items-end"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <label className="block min-w-0 flex-1" htmlFor={inputId}>
            <span className="text-sm font-medium text-slate-700">
              Voucher code
            </span>
            <input
              ref={inputRef}
              id={inputId}
              data-testid="voucher-code-input"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={code}
              disabled={busy}
              onChange={(event) => {
                setCode(event.target.value);
                setError(null);
                if (status === "success") {
                  setSuccess(null);
                  setStatus("idle");
                }
              }}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-600 focus:ring-2 disabled:opacity-60"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              data-testid="voucher-redeem-submit"
              disabled={busy || !code.trim()}
              className={buttonClassName({
                variant: "primary",
                size: "lg",
                tone: "app",
              })}
            >
              {busy ? "Redeeming…" : "Redeem"}
            </button>
            {pasteAvailable ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handlePaste()}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 disabled:opacity-50"
              >
                Paste
              </button>
            ) : null}
            {scanCapable ? (
              <button
                type="button"
                disabled={busy}
                data-testid="voucher-scan-button"
                onClick={() => void handleOpenScanner()}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 disabled:opacity-50"
              >
                Scan QR
              </button>
            ) : (
              <p className="self-center text-xs text-slate-500">
                Camera scan unavailable in this browser.
              </p>
            )}
          </div>
        </form>

        {error ? (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-950"
            data-testid="voucher-redeem-error"
          >
            <p>{error.message}</p>
            {error.retryable ? (
              <button
                type="button"
                className="mt-2 font-medium underline"
                disabled={busy}
                onClick={() => void runRedeem(code)}
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : null}

        {scannerNote ? (
          <p className="mt-2 text-sm text-slate-600" role="status">
            {scannerNote}
          </p>
        ) : null}

        {scannerOpen ? (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4 md:static md:z-auto md:mt-4 md:bg-transparent md:p-0"
            data-testid="voucher-scanner"
          >
            <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-lg md:max-w-none md:border md:border-slate-200 md:shadow-none">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-800">
                  Point your camera at the voucher QR
                </p>
                <button
                  type="button"
                  className="text-sm font-medium text-slate-700 underline"
                  onClick={() => void closeScanner()}
                >
                  Close
                </button>
              </div>
              <div
                ref={scannerHostRef}
                className="overflow-hidden rounded-xl"
              />
            </div>
          </div>
        ) : null}
      </CardSection>
    </Card>
  );
}
