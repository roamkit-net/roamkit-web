/** Order and top-up spend types (POST /api/v1/orders/, POST …/topups/). */

export type OrderEsim = {
  id: number;
  iccid: string;
  lpa: string;
  matching_id: string;
  qrcode: string;
  qrcode_url: string;
  direct_apple_installation_url: string;
  manual_installation: string;
  qrcode_installation: string;
  installation_guide_url: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: number;
  package_id: string;
  status: string;
  external_order_id: string | null;
  customer_ref: string | null;
  idempotency_key: string;
  esims: OrderEsim[];
  created_at: string;
  updated_at: string;
};

export type CreateOrderPayload = {
  package_id: string;
  idempotency_key: string;
};

export type TopupPurchase = {
  id: string;
  package_external_id: string;
  amount: string;
  status: string;
  external_order_id: string | null;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
};

export type PurchaseTopupPayload = {
  package_id: string;
  idempotency_key: string;
};

/** Structured 402 body from InsufficientFundsError.to_api_dict(). */
export type InsufficientCreditsPayload = {
  code: "INSUFFICIENT_CREDITS";
  detail: string;
  required: string;
  balance: string;
  missing: string;
};
