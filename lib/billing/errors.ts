import { isAbortError } from "@/lib/billing/wait";

export type BillingErrorCategory =
  | "validation"
  | "network"
  | "pending"
  | "server"
  | "fatal";

export type BillingError = {
  code: string;
  category: BillingErrorCategory;
  message: string;
  /** Present when code is AMOUNT_MISMATCH (verify deposit). */
  onChainAmount?: string;
};

export class BillingClientError extends Error implements BillingError {
  readonly code: string;
  readonly category: BillingErrorCategory;
  readonly onChainAmount?: string;

  constructor(error: BillingError) {
    super(error.message);
    this.name = "BillingClientError";
    this.code = error.code;
    this.category = error.category;
    if (error.onChainAmount) {
      this.onChainAmount = error.onChainAmount;
    }
  }

  toJSON(): BillingError {
    return {
      code: this.code,
      category: this.category,
      message: this.message,
      ...(this.onChainAmount ? { onChainAmount: this.onChainAmount } : {}),
    };
  }
}

type HttpLikeError = {
  status?: unknown;
  body?: unknown;
  message?: unknown;
};

function readHttpStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") {
    return null;
  }
  const status = (error as HttpLikeError).status;
  return typeof status === "number" ? status : null;
}

function asRecord(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  return body as Record<string, unknown>;
}

/** Prefer the structured API `code` when the backend sends one. */
export function readApiErrorCode(body: unknown): string | null {
  const record = asRecord(body);
  if (!record) {
    return null;
  }
  const code = record.code;
  if (typeof code === "string" && code.trim()) {
    return code.trim();
  }
  return null;
}

function readBodyText(body: unknown): string {
  if (!body) {
    return "";
  }
  if (typeof body === "string") {
    return body;
  }
  const record = asRecord(body);
  if (!record) {
    return "";
  }
  const parts: string[] = [];
  for (const key of ["detail", "failure_reason", "message", "code"]) {
    const value = record[key];
    if (typeof value === "string" && value) {
      parts.push(value);
    }
  }
  return parts.join(" ").toLowerCase();
}

function readApiUserMessage(body: unknown): string | null {
  if (typeof body === "string" && body.trim()) {
    return body.trim();
  }
  const record = asRecord(body);
  if (!record) {
    return null;
  }
  for (const key of ["detail", "failure_reason", "message"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function inferCodeFromBody(bodyText: string, status: number | null): string {
  if (bodyText.includes("insufficient confirmation")) {
    return "NOT_ENOUGH_CONFIRMATIONS";
  }
  if (bodyText.includes("amount mismatch")) {
    return "AMOUNT_MISMATCH";
  }
  if (bodyText.includes("already verified") || bodyText.includes("duplicate")) {
    return "ALREADY_VERIFIED";
  }
  if (bodyText.includes("wrong network") || bodyText.includes("chain_id")) {
    return "WRONG_NETWORK";
  }
  if (bodyText.includes("invalid") && bodyText.includes("tx")) {
    return "INVALID_TX";
  }
  if (bodyText.includes("not found")) {
    return "NOT_FOUND";
  }
  if (status === 402) {
    return "INSUFFICIENT_CREDITS";
  }
  if (status === 400) {
    return "VALIDATION_ERROR";
  }
  if (status === 401 || status === 403) {
    return "UNAUTHORIZED";
  }
  if (status === 404) {
    return "NOT_FOUND";
  }
  if (status === 408 || status === 429) {
    return "TEMPORARY_FAILURE";
  }
  if (status !== null && status >= 500) {
    return "SERVER_ERROR";
  }
  if (status !== null && status >= 400) {
    return "REQUEST_FAILED";
  }
  return "UNKNOWN";
}

function categoryForCode(
  code: string,
  status: number | null,
): BillingErrorCategory {
  switch (code) {
    case "NOT_ENOUGH_CONFIRMATIONS":
      return "pending";
    case "INVALID_TX":
    case "ALREADY_VERIFIED":
    case "WRONG_NETWORK":
    case "VALIDATION_ERROR":
    case "AMOUNT_MISMATCH":
    case "INSUFFICIENT_CREDITS":
      return "validation";
    case "UNAUTHORIZED":
      return "fatal";
    case "NOT_FOUND":
      return status === 404 ? "fatal" : "validation";
    case "NETWORK_ERROR":
    case "ABORTED":
      return "network";
    case "TEMPORARY_FAILURE":
    case "SERVER_ERROR":
      return "server";
    case "POLL_TIMEOUT":
      return "pending";
    default:
      if (status !== null && status >= 500) {
        return "server";
      }
      if (status !== null && status >= 400) {
        return "validation";
      }
      return "fatal";
  }
}

function curatedMessage(code: string): string | null {
  switch (code) {
    case "NOT_ENOUGH_CONFIRMATIONS":
      return "Waiting for more blockchain confirmations.";
    case "NETWORK_ERROR":
      return "Network error. Check your connection and try again.";
    case "ABORTED":
      return "Request was cancelled.";
    case "POLL_TIMEOUT":
      return "Timed out waiting for deposit confirmation.";
    case "INSUFFICIENT_CREDITS":
      return "Not enough credits for this purchase.";
    case "AMOUNT_MISMATCH":
      return "The amount on-chain does not match the amount you entered.";
    case "UNAUTHORIZED":
      return "You need to sign in again.";
    case "SERVER_ERROR":
      return "Billing service is temporarily unavailable.";
    default:
      return null;
  }
}

function resolveMessage(
  code: string,
  fallback: string | undefined,
  body: unknown,
  error: unknown,
): string {
  if (fallback) {
    return fallback;
  }
  const apiMessage = readApiUserMessage(body);
  if (apiMessage) {
    return apiMessage;
  }
  const curated = curatedMessage(code);
  if (curated) {
    return curated;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong with billing.";
}

/** Map any thrown value into the shared billing error model. */
export function toBillingError(
  error: unknown,
  fallbackMessage?: string,
): BillingError {
  if (error instanceof BillingClientError) {
    return error.toJSON();
  }

  if (isAbortError(error)) {
    return {
      code: "ABORTED",
      category: "network",
      message: resolveMessage("ABORTED", fallbackMessage, undefined, error),
    };
  }

  const status = readHttpStatus(error);
  const body =
    error && typeof error === "object"
      ? (error as HttpLikeError).body
      : undefined;
  const bodyText = readBodyText(body);

  if (status === null && error instanceof TypeError) {
    return {
      code: "NETWORK_ERROR",
      category: "network",
      message: resolveMessage("NETWORK_ERROR", fallbackMessage, body, error),
    };
  }

  // Prefer structured API `code` so UI can branch on code, not message text.
  const code = readApiErrorCode(body) ?? inferCodeFromBody(bodyText, status);
  const record = asRecord(body);
  const onChainRaw =
    record && typeof record.on_chain_amount === "string"
      ? record.on_chain_amount.trim()
      : "";
  return {
    code,
    category: categoryForCode(code, status),
    message: resolveMessage(code, fallbackMessage, body, error),
    ...(code === "AMOUNT_MISMATCH" && onChainRaw
      ? { onChainAmount: onChainRaw }
      : {}),
  };
}

export function toBillingClientError(
  error: unknown,
  fallbackMessage?: string,
): BillingClientError {
  if (error instanceof BillingClientError) {
    return error;
  }
  return new BillingClientError(toBillingError(error, fallbackMessage));
}
