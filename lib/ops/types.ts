/** Types for staff Operations Dashboard (`/api/v1/admin/*`). */

export type OpsSeverity = "info" | "warning" | "error";

export type OpsEventGroup =
  | "account"
  | "billing"
  | "order"
  | "esim"
  | "wallet"
  | "voucher";

export type OpsEvent = {
  schema_version: number;
  type: string;
  timestamp: string;
  title: string;
  subtitle: string;
  reference_id: string;
  severity: OpsSeverity;
  event_group: OpsEventGroup;
  icon: string;
  user_id?: number | null;
  user_email?: string | null;
};

export type OpsHealthStatus =
  | "healthy"
  | "degraded"
  | "unhealthy"
  | "unknown";

export type OpsHealthCache = {
  hit: boolean;
  ttl_remaining_ms?: number | null;
  expires_at?: string | null;
};

/** Locked Observability V1 check DTO — UI branches on status/reason/source only. */
export type OpsHealthItem = {
  status: OpsHealthStatus | string;
  reason: string;
  message: string;
  checked_at: string;
  source: string;
  timeout_ms: number;
  latency_ms?: number | null;
  last_success_at?: string | null;
  cache?: OpsHealthCache;
  details: Record<string, unknown>;
};

export type OpsHealthMetric = {
  key: string;
  value: number | null;
  unit: string;
  status: string;
};

export type OpsHealth = {
  schema_version: number;
  overall_status: OpsHealthStatus | string;
  generated_at: string;
  version: {
    git_sha?: string;
    build_date?: string;
    image_tag?: string;
    environment?: string;
    release?: string;
    deployment_id?: string;
    [key: string]: unknown;
  };
  dependencies: Record<string, OpsHealthItem>;
  workers: Record<string, OpsHealthItem>;
  providers: Record<string, OpsHealthItem>;
  metrics: OpsHealthMetric[];
  checks: Record<string, OpsHealthItem>;
};

export type OpsAlert = {
  code: string;
  severity: string;
  title: string;
  count: number;
};

export type OpsDashboard = {
  schema_version: number;
  kpi: {
    users_total: number;
    active_esims: number;
    new_users_today: number;
    orders_today: number;
    deposits_today: number;
    revenue_today: string;
    new_esims_today: number;
    topups_today: number;
  };
  pending_work: {
    pending_deposits: number;
    pending_topups: number;
    pending_orders: number;
    failed_orders_24h: number;
    stuck_installs: number;
  };
  financial: {
    deposits_today_amount: string;
    spend_today_amount: string;
    average_deposit_30d: string;
    largest_deposit_30d: string;
    pending_deposit_amount: string;
    revenue_today: string;
  };
  top_destinations: { country_code: string; count: number }[];
  top_packages: { package_title: string; count: number }[];
  alerts: OpsAlert[];
  health: OpsHealth;
  activity: OpsEvent[];
};

export type OpsSearchHitBase = {
  id: number | string;
  label: string;
  match: string;
};

export type OpsSearchResponse = {
  schema_version: number;
  query: string;
  users: OpsSearchHitBase[];
  orders: (OpsSearchHitBase & {
    status: string;
    user_id: number;
    user_email: string;
  })[];
  deposits: (OpsSearchHitBase & {
    status: string;
    user_id: number;
    user_email: string;
  })[];
  esims: (OpsSearchHitBase & {
    status: string;
    user_id: number;
    user_email: string;
  })[];
  vouchers: (OpsSearchHitBase & { status: string })[];
};

export type OpsUserListItem = {
  id: number;
  email: string;
  is_active: boolean;
  is_staff: boolean;
  last_login: string | null;
  balance: string | null;
  badges: string[];
};

export type OpsPaginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type OpsUserDetail = {
  schema_version: number;
  id: number;
  email: string;
  is_active: boolean;
  is_staff: boolean;
  created_at: string;
  last_login: string | null;
  badges: string[];
  account: { id: string; balance: string; version: number } | null;
  esims: {
    id: number;
    iccid: string;
    status: string;
    status_label: string;
    order_id: number;
    created_at: string;
  }[];
  wallet: {
    wallet_age: string | null;
    addresses: {
      id: string;
      chain: string;
      address: string;
      status: string;
      derivation_index: number;
      created_at: string;
    }[];
    has_completed_deposit: boolean;
    last_deposit_at: string | null;
    last_tx_hash: string | null;
    total_deposited: string;
  } | null;
  device_hints: { user_agent: string };
  timeline: OpsEvent[];
};
