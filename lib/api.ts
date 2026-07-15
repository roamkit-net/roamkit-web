const DEFAULT_API_URL = "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
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

export async function fetchApi<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${baseUrl}${normalizedPath}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed: ${response.status} ${response.statusText}`,
      response.status,
    );
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
