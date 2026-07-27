import { ApiError } from "@/lib/api";
import { isAbortError } from "@/lib/billing/wait";

export type VoucherErrorCategory =
  | "network"
  | "validation"
  | "business"
  | "throttle"
  | "unknown";

/** Known API voucher error codes — keep in sync with roamkit-api VoucherError subclasses. */
export const VOUCHER_API_CODES = [
  "voucher_invalid",
  "voucher_expired",
  "voucher_revoked",
  "voucher_reserved",
  "voucher_limit",
  "voucher_unsupported_reward",
] as const;

export type VoucherApiCode = (typeof VOUCHER_API_CODES)[number];

export type VoucherUiError = {
  code: string;
  category: VoucherErrorCategory;
  message: string;
  retryable: boolean;
};

function assertNever(value: never): never {
  throw new Error(`Unexpected voucher error code: ${String(value)}`);
}

function messageForApiCode(code: VoucherApiCode): string {
  switch (code) {
    case "voucher_invalid":
      return "Voucher code is invalid.";
    case "voucher_expired":
      return "Voucher has expired.";
    case "voucher_revoked":
      return "Voucher has been revoked.";
    case "voucher_reserved":
      return "Voucher code is reserved.";
    case "voucher_limit":
      return "Redemption limit reached for this voucher.";
    case "voucher_unsupported_reward":
      return "This voucher type is not supported.";
    default:
      return assertNever(code);
  }
}

function isVoucherApiCode(code: string): code is VoucherApiCode {
  return (VOUCHER_API_CODES as readonly string[]).includes(code);
}

export function toVoucherUiError(error: unknown): VoucherUiError {
  if (isAbortError(error)) {
    return {
      code: "ABORTED",
      category: "network",
      message: "Request was cancelled.",
      retryable: false,
    };
  }

  if (error instanceof TypeError) {
    return {
      code: "NETWORK_ERROR",
      category: "network",
      message:
        "Unable to contact the server. Please check your connection and try again.",
      retryable: true,
    };
  }

  if (error instanceof ApiError) {
    if (error.status === 429) {
      return {
        code: "THROTTLED",
        category: "throttle",
        message: "Too many attempts. Please try again later.",
        retryable: true,
      };
    }

    const body =
      error.body && typeof error.body === "object"
        ? (error.body as Record<string, unknown>)
        : null;
    const apiCode = typeof body?.code === "string" ? body.code : null;

    if (apiCode && isVoucherApiCode(apiCode)) {
      return {
        code: apiCode,
        category: "business",
        message: messageForApiCode(apiCode),
        retryable: false,
      };
    }

    if (error.status === 404) {
      return {
        code: "NOT_FOUND",
        category: "business",
        message: "Voucher redemption is not available.",
        retryable: false,
      };
    }

    if (error.status >= 500) {
      return {
        code: "SERVER_ERROR",
        category: "network",
        message:
          "Unable to contact the server. Please check your connection and try again.",
        retryable: true,
      };
    }
  }

  return {
    code: "UNKNOWN",
    category: "unknown",
    message: "Unable to redeem this voucher. Please try again.",
    retryable: true,
  };
}

export const QR_INVALID_MESSAGE = "QR code is not a valid voucher.";
