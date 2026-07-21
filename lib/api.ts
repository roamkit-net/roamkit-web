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
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function fetchPackages(
  country?: string,
): Promise<PaginatedResponse<Package>> {
  const query = country ? `?country=${encodeURIComponent(country)}` : "";
  return fetchApi<PaginatedResponse<Package>>(`/api/v1/packages/${query}`, {
    cache: "no-store",
  });
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
  usage_remaining_mb: number | null;
  usage_total_mb: number | null;
  usage_status: string | null;
  usage_is_unlimited: boolean | null;
  usage_expired_at: string | null;
  usage_synced_at: string | null;
  created_at: string;
  updated_at: string;
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

export async function registerUser(email: string): Promise<{ detail: string }> {
  try {
    return await fetchApi<{ detail: string }>("/api/v1/auth/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
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
): Promise<{ detail: string }> {
  try {
    return await fetchApi<{ detail: string }>("/api/v1/auth/password-reset/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
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
): Promise<AuthTokens> {
  try {
    const tokens = await fetchApi<AuthTokens>("/api/v1/auth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
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
