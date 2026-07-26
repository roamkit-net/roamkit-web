import { clearPendingSpend } from "@/lib/orders/pendingSpend";

const DEFAULT_API_URL = "http://localhost:8000";

const ACCESS_TOKEN_KEY = "roamkit_access_token";
const REFRESH_TOKEN_KEY = "roamkit_refresh_token";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getAccessToken(): string | null {
  if (!canUseLocalStorage()) {
    return null;
  }
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!canUseLocalStorage()) {
    return null;
  }
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  if (!canUseLocalStorage()) {
    return;
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens(): void {
  clearPendingSpend();
  if (!canUseLocalStorage()) {
    return;
  }
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

export type ApiHealthStatus = {
  live: boolean;
  ready: boolean;
};

export async function checkApiHealth(): Promise<ApiHealthStatus> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  let live = false;
  let ready = false;

  try {
    const liveResponse = await fetch(`${baseUrl}/health/live`, {
      cache: "no-store",
    });
    live = liveResponse.ok;
  } catch {
    live = false;
  }

  try {
    const readyResponse = await fetch(`${baseUrl}/health/ready`, {
      cache: "no-store",
    });
    ready = readyResponse.ok;
  } catch {
    ready = false;
  }

  return { live, ready };
}

type FetchApiOptions = RequestInit & {
  auth?: boolean;
  skipRefresh?: boolean;
};

async function parseErrorBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export async function fetchApi<T>(
  path: string,
  init?: FetchApiOptions,
): Promise<T> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (init?.auth) {
    const access = getAccessToken();
    if (access) {
      headers.set("Authorization", `Bearer ${access}`);
    }
  }

  const response = await fetch(`${baseUrl}${normalizedPath}`, {
    ...init,
    headers,
  });

  if (
    response.status === 401 &&
    init?.auth &&
    !init.skipRefresh &&
    getRefreshToken()
  ) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return fetchApi<T>(path, { ...init, skipRefresh: true });
    }
    clearTokens();
  }

  if (!response.ok) {
    const body = await parseErrorBody(response);
    throw new ApiError(
      `Request failed: ${response.status} ${response.statusText}`,
      response.status,
      body,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export type Package = {
  id: string;
  title: string;
  operator_title: string;
  country_code: string;
  data_allowance: string;
  validity_days: number;
  price_usd: string;
  is_unlimited: boolean;
  plan_type: string;
  voice_minutes: number | null;
  text_sms: number | null;
};

export type LocationCoverageType = "local" | "regional" | "global";

export type CoverageNetwork = {
  name: string;
  types: string[];
};

export type LocationCoverage = {
  code: string;
  name: string;
  networks: CoverageNetwork[];
};

export type Location = {
  slug: string;
  title: string;
  country_code: string;
  coverage_type: LocationCoverageType;
  image_url: string;
  is_popular: boolean;
  min_price_usd: string | null;
  covered_country_codes: string[];
  coverages: LocationCoverage[];
  broader_locations?: Location[];
};

export type LocationListType =
  | "popular"
  | "local"
  | "regional"
  | "global"
  | "all";

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function fetchPackages(options?: {
  country?: string;
  location?: string;
  page?: number;
}): Promise<PaginatedResponse<Package>> {
  const params = new URLSearchParams();
  if (options?.country) {
    params.set("country", options.country);
  }
  if (options?.location) {
    params.set("location", options.location);
  }
  if (options?.page && options.page > 1) {
    params.set("page", String(options.page));
  }
  const query = params.toString();
  const suffix = query ? `?${query}` : "";
  return fetchApi<PaginatedResponse<Package>>(`/api/v1/packages/${suffix}`, {
    cache: "no-store",
  });
}

export async function fetchAllPackages(options?: {
  country?: string;
  location?: string;
}): Promise<Package[]> {
  const results: Package[] = [];
  let page = 1;

  for (;;) {
    const response = await fetchPackages({ ...options, page });
    results.push(...response.results);
    if (!response.next || page >= 40) {
      break;
    }
    page += 1;
  }

  return results;
}

export async function fetchLocations(
  type?: LocationListType,
  options?: { page?: number },
): Promise<PaginatedResponse<Location>> {
  const params = new URLSearchParams();
  if (type && type !== "all") {
    params.set("type", type);
  }
  if (options?.page && options.page > 1) {
    params.set("page", String(options.page));
  }
  const query = params.toString();
  const suffix = query ? `?${query}` : "";
  return fetchApi<PaginatedResponse<Location>>(`/api/v1/locations/${suffix}`, {
    cache: "no-store",
  });
}

export async function fetchAllLocations(
  type?: LocationListType,
): Promise<Location[]> {
  const results: Location[] = [];
  let page = 1;

  for (;;) {
    const response = await fetchLocations(type, { page });
    results.push(...response.results);
    if (!response.next || page >= 40) {
      break;
    }
    page += 1;
  }

  return results;
}

export async function fetchLocation(slug: string): Promise<Location> {
  return fetchApi<Location>(
    `/api/v1/locations/${encodeURIComponent(slug)}/`,
    { cache: "no-store" },
  );
}

export function flagImageUrl(countryCode: string): string {
  return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
}

export function locationImageSrc(location: Pick<Location, "image_url" | "country_code">): string | null {
  if (location.image_url) {
    return location.image_url;
  }
  if (location.country_code) {
    return flagImageUrl(location.country_code);
  }
  return null;
}

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type User = {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
};

export type Esim = {
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
  /** Present after Faza 5 Wave 1 API deploy; optional for older backends. */
  activation_policy?: string | null;
  setup_version?: string | null;
  setup_resume_step?: number | null;
  setup_completed_at?: string | null;
  setup_skipped_at?: string | null;
  usage_remaining_mb: number | null;
  usage_total_mb: number | null;
  usage_status: string | null;
  usage_is_unlimited: boolean | null;
  usage_expired_at: string | null;
  usage_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EsimLifecycleEvent = {
  id: string;
  event_type: string;
  source: string;
  schema_version: number;
  idempotency_key: string;
  setup_session_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export type EsimUsage = {
  remaining_mb: number;
  total_mb: number;
  expired_at: string | null;
  is_unlimited: boolean | null;
  status: string;
  remaining_voice: number;
  remaining_text: number;
  total_voice: number;
  total_text: number;
};

export type TopupPackage = {
  id: string;
  title: string;
  data_allowance: string;
  validity_days: number;
  price_usd: string;
  is_unlimited: boolean;
  plan_type: string;
};

function formatApiValidationMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") {
    return fallback;
  }

  const record = body as Record<string, unknown>;
  const parts: string[] = [];

  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string") {
      parts.push(key === "detail" ? value : `${key}: ${value}`);
      continue;
    }
    if (Array.isArray(value)) {
      const joined = value.filter((item) => typeof item === "string").join(" ");
      if (joined) {
        parts.push(key === "non_field_errors" ? joined : `${key}: ${joined}`);
      }
    }
  }

  return parts.length > 0 ? parts.join(" ") : fallback;
}

async function tryRefreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) {
    return false;
  }

  try {
    const tokens = await fetchApi<Pick<AuthTokens, "access">>("/api/v1/auth/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
      skipRefresh: true,
    });
    const access = tokens.access;
    if (!access) {
      return false;
    }
    setTokens(access, refresh);
    return true;
  } catch {
    return false;
  }
}

export async function registerUser(
  email: string,
  turnstileToken?: string,
): Promise<{ detail: string }> {
  try {
    return await fetchApi<{ detail: string }>("/api/v1/auth/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      }),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(
        formatApiValidationMessage(error.body, "Registration failed."),
        error.status,
        error.body,
      );
    }
    throw error;
  }
}

export async function activateAccount(
  uid: string,
  token: string,
  password: string,
  passwordConfirm: string,
): Promise<User> {
  try {
    return await fetchApi<User>("/api/v1/auth/activate/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        token,
        password,
        password_confirm: passwordConfirm,
      }),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(
        formatApiValidationMessage(error.body, "Unable to activate account."),
        error.status,
        error.body,
      );
    }
    throw error;
  }
}

export async function requestPasswordReset(
  email: string,
  turnstileToken?: string,
): Promise<{ detail: string }> {
  try {
    return await fetchApi<{ detail: string }>("/api/v1/auth/password-reset/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      }),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(
        formatApiValidationMessage(error.body, "Unable to request password reset."),
        error.status,
        error.body,
      );
    }
    throw error;
  }
}

export async function confirmPasswordReset(
  uid: string,
  token: string,
  password: string,
  passwordConfirm: string,
): Promise<{ detail: string }> {
  try {
    return await fetchApi<{ detail: string }>(
      "/api/v1/auth/password-reset/confirm/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          token,
          password,
          password_confirm: passwordConfirm,
        }),
      },
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(
        formatApiValidationMessage(error.body, "Unable to reset password."),
        error.status,
        error.body,
      );
    }
    throw error;
  }
}

export async function login(
  email: string,
  password: string,
  turnstileToken?: string,
): Promise<AuthTokens> {
  try {
    const tokens = await fetchApi<AuthTokens>("/api/v1/auth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      }),
    });
    setTokens(tokens.access, tokens.refresh);
    return tokens;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(
        formatApiValidationMessage(error.body, "Invalid email or password."),
        error.status,
        error.body,
      );
    }
    throw error;
  }
}

const GOOGLE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  google_invalid_token: "Google sign-in failed. Please try again.",
  google_email_not_verified:
    "Your Google account email is not verified. Verify it with Google, or use email sign-in.",
  google_account_disabled: "This account is disabled.",
  google_sub_conflict: "This Google account is already linked to another user.",
  google_feature_disabled: "Google sign-in is not available.",
  google_verify_unavailable:
    "Google sign-in is temporarily unavailable. Please try again.",
};

export function formatGoogleAuthError(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const code = (body as { code?: unknown }).code;
    if (typeof code === "string" && GOOGLE_AUTH_ERROR_MESSAGES[code]) {
      return GOOGLE_AUTH_ERROR_MESSAGES[code];
    }
  }
  return formatApiValidationMessage(body, fallback);
}

export async function loginWithGoogle(credential: string): Promise<AuthTokens> {
  try {
    const tokens = await fetchApi<AuthTokens>("/api/v1/auth/google/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    setTokens(tokens.access, tokens.refresh);
    return tokens;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(
        formatGoogleAuthError(error.body, "Unable to sign in with Google."),
        error.status,
        error.body,
      );
    }
    throw error;
  }
}

export function logout(): void {
  clearTokens();
}

export async function fetchMe(): Promise<User> {
  return fetchApi<User>("/api/v1/auth/me/", { auth: true, cache: "no-store" });
}

export async function fetchMyEsims(): Promise<PaginatedResponse<Esim>> {
  return fetchApi<PaginatedResponse<Esim>>("/api/v1/me/esims/", {
    auth: true,
    cache: "no-store",
  });
}

export async function fetchMyEsim(id: number | string): Promise<Esim> {
  return fetchApi<Esim>(`/api/v1/me/esims/${id}/`, {
    auth: true,
    cache: "no-store",
  });
}

export async function fetchMyEsimUsage(id: number | string): Promise<EsimUsage> {
  return fetchApi<EsimUsage>(`/api/v1/me/esims/${id}/usage/`, {
    auth: true,
    cache: "no-store",
  });
}

export async function fetchMyEsimTopups(
  id: number | string,
): Promise<{ results: TopupPackage[] }> {
  return fetchApi<{ results: TopupPackage[] }>(`/api/v1/me/esims/${id}/topups/`, {
    auth: true,
    cache: "no-store",
  });
}

export type PostEsimEventInput = {
  event_type: string;
  idempotency_key: string;
  setup_session_id?: string;
  schema_version?: number;
  payload?: Record<string, unknown>;
  resume_step?: number;
};

export async function postMyEsimEvent(
  id: number | string,
  body: PostEsimEventInput,
): Promise<EsimLifecycleEvent> {
  return fetchApi<EsimLifecycleEvent>(`/api/v1/me/esims/${id}/events/`, {
    method: "POST",
    auth: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

export async function fetchMyEsimEvents(
  id: number | string,
): Promise<EsimLifecycleEvent[]> {
  return fetchApi<EsimLifecycleEvent[]>(`/api/v1/me/esims/${id}/events/`, {
    auth: true,
    cache: "no-store",
  });
}
