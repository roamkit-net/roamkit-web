import { clearPendingSpend } from "@/lib/orders/pendingSpend";

const DEFAULT_API_URL = "http://localhost:8000";

/**
 * Token storage invariant
 *
 * At any time, valid tokens must exist in exactly one store:
 * localStorage XOR sessionStorage XOR in-memory.
 *
 * If both web storages contain tokens (unexpected), localStorage wins and
 * sessionStorage is cleared immediately on the next read or write.
 */
export const ACCESS_TOKEN_KEY = "roamkit_access_token";
export const REFRESH_TOKEN_KEY = "roamkit_refresh_token";
export const REMEMBER_ME_KEY = "roamkit_remember_me";

type MemoryTokens = { access: string; refresh: string };
let memoryTokens: MemoryTokens | null = null;

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
  try {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

function canUseSessionStorage(): boolean {
  try {
    return (
      typeof window !== "undefined" && typeof sessionStorage !== "undefined"
    );
  } catch {
    return false;
  }
}

function readStorageItem(storage: Storage, key: string): string | null {
  try {
    const value = storage.getItem(key);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeStorageItem(storage: Storage, key: string, value: string): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeStorageItem(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Best-effort — private browsing / SecurityError.
  }
}

function clearWebStorageTokens(storage: Storage): void {
  removeStorageItem(storage, ACCESS_TOKEN_KEY);
  removeStorageItem(storage, REFRESH_TOKEN_KEY);
}

function storageHasTokenKeys(storage: Storage): boolean {
  return Boolean(
    readStorageItem(storage, ACCESS_TOKEN_KEY) ||
      readStorageItem(storage, REFRESH_TOKEN_KEY),
  );
}

type TokenStore = "local" | "session" | "memory";

/**
 * Resolve the active token store. Repairs dual web-storage by preferring
 * localStorage and clearing sessionStorage.
 */
function resolveTokenStore(): TokenStore | null {
  const hasLocal = canUseLocalStorage() && storageHasTokenKeys(localStorage);
  const hasSession =
    canUseSessionStorage() && storageHasTokenKeys(sessionStorage);

  if (hasLocal) {
    if (hasSession) {
      clearWebStorageTokens(sessionStorage);
    }
    return "local";
  }
  if (hasSession) {
    return "session";
  }
  if (memoryTokens) {
    return "memory";
  }
  return null;
}

export function getRememberMePreference(): boolean {
  if (!canUseLocalStorage()) {
    return true;
  }
  try {
    const raw = localStorage.getItem(REMEMBER_ME_KEY);
    if (raw === null) {
      return true;
    }
    return raw !== "false";
  } catch {
    return true;
  }
}

export function setRememberMePreference(value: boolean): void {
  if (!canUseLocalStorage()) {
    return;
  }
  try {
    localStorage.setItem(REMEMBER_ME_KEY, value ? "true" : "false");
  } catch {
    // Preference is best-effort; default remains true on next load.
  }
}

export function getAccessToken(): string | null {
  const store = resolveTokenStore();
  if (store === "local") {
    return readStorageItem(localStorage, ACCESS_TOKEN_KEY);
  }
  if (store === "session") {
    return readStorageItem(sessionStorage, ACCESS_TOKEN_KEY);
  }
  if (store === "memory") {
    return memoryTokens?.access ?? null;
  }
  return null;
}

export function getRefreshToken(): string | null {
  const store = resolveTokenStore();
  if (store === "local") {
    return readStorageItem(localStorage, REFRESH_TOKEN_KEY);
  }
  if (store === "session") {
    return readStorageItem(sessionStorage, REFRESH_TOKEN_KEY);
  }
  if (store === "memory") {
    return memoryTokens?.refresh ?? null;
  }
  return null;
}

/**
 * Persist tokens in exactly one store.
 * When `rememberMe` is omitted (silent refresh), rewrite into the current store.
 */
export function setTokens(
  access: string,
  refresh: string,
  rememberMe?: boolean,
): void {
  let target: TokenStore;
  if (rememberMe !== undefined) {
    target = rememberMe ? "local" : "session";
  } else {
    const current = resolveTokenStore();
    if (current === "session") {
      target = "session";
    } else if (current === "memory") {
      target = "memory";
    } else {
      // local, or no existing tokens → prefer local (default remember).
      target = "local";
    }
  }

  if (target === "memory") {
    memoryTokens = { access, refresh };
    if (canUseLocalStorage()) {
      clearWebStorageTokens(localStorage);
    }
    if (canUseSessionStorage()) {
      clearWebStorageTokens(sessionStorage);
    }
    return;
  }

  if (target === "local") {
    const wrote =
      canUseLocalStorage() &&
      writeStorageItem(localStorage, ACCESS_TOKEN_KEY, access) &&
      writeStorageItem(localStorage, REFRESH_TOKEN_KEY, refresh);
    if (wrote) {
      if (canUseSessionStorage()) {
        clearWebStorageTokens(sessionStorage);
      }
      memoryTokens = null;
      return;
    }
  } else {
    const wrote =
      canUseSessionStorage() &&
      writeStorageItem(sessionStorage, ACCESS_TOKEN_KEY, access) &&
      writeStorageItem(sessionStorage, REFRESH_TOKEN_KEY, refresh);
    if (wrote) {
      if (canUseLocalStorage()) {
        clearWebStorageTokens(localStorage);
      }
      memoryTokens = null;
      return;
    }
  }

  // Web Storage unavailable / throwing → in-memory page session.
  memoryTokens = { access, refresh };
  if (canUseLocalStorage()) {
    clearWebStorageTokens(localStorage);
  }
  if (canUseSessionStorage()) {
    clearWebStorageTokens(sessionStorage);
  }
}

export function clearTokens(): void {
  clearPendingSpend();
  memoryTokens = null;
  if (canUseLocalStorage()) {
    clearWebStorageTokens(localStorage);
  }
  if (canUseSessionStorage()) {
    clearWebStorageTokens(sessionStorage);
  }
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
  /** Purchase-time Order snapshot (PR2+); optional during API rollout. */
  package_title?: string;
  location_title?: string;
  country_code?: string;
  data_allowance?: string;
  validity_days?: number | null;
  /** What the customer paid (credits); never wholesale. */
  paid_usd?: string | null;
  currency?: string;
  issued_at?: string;
  activated_at?: string | null;
  /** User-local metadata; optional during API rollout. Never synced to Airalo. */
  note?: string;
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
  rememberMe: boolean = getRememberMePreference(),
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
    setRememberMePreference(rememberMe);
    setTokens(tokens.access, tokens.refresh, rememberMe);
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

export async function loginWithGoogle(
  credential: string,
  rememberMe: boolean = getRememberMePreference(),
): Promise<AuthTokens> {
  try {
    const tokens = await fetchApi<AuthTokens>("/api/v1/auth/google/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    setRememberMePreference(rememberMe);
    setTokens(tokens.access, tokens.refresh, rememberMe);
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

export async function patchMyEsim(
  id: number | string,
  body: { note: string },
): Promise<Esim> {
  return fetchApi<Esim>(`/api/v1/me/esims/${id}/`, {
    method: "PATCH",
    auth: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
