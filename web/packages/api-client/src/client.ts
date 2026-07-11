import { API_ROUTES } from "./routes";
import type { ApiError, ApiSuccess } from "./types";

export type ApiClientOptions = {
  baseUrl: string;
  getAccessToken?: () => string | null;
  getRefreshToken?: () => string | null;
  onTokensRefreshed?: (tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }) => void;
  onUnauthorized?: () => void;
};

export class ApiClient {
  private refreshPromise: Promise<boolean> | null = null;

  constructor(private readonly options: ApiClientOptions) {}

  get routes() {
    return API_ROUTES;
  }

  async request<T>(path: string, init?: RequestInit, allowRefresh = true): Promise<T> {
    const headers = new Headers(init?.headers);
    if (!headers.has("Content-Type") && init?.body) {
      headers.set("Content-Type", "application/json");
    }

    const token = this.options.getAccessToken?.();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let response: Response;
    try {
      response = await fetch(`${this.options.baseUrl}${path}`, {
        ...init,
        headers,
      });
    } catch {
      throw new Error(
        "Cannot reach API Gateway (http://localhost:5000). Start Gateway + Identity + Workspace, then try again.",
      );
    }

    if (response.status === 401 && allowRefresh && path !== API_ROUTES.auth.refresh) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        return this.request<T>(path, init, false);
      }

      this.options.onUnauthorized?.();
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const err = body as ApiError | null;
      if (response.status === 502 || response.status === 503) {
        throw new Error(
          "API Gateway cannot reach a backend service. Make sure Identity (:5010) and Workspace (:5020) are running.",
        );
      }
      throw new Error(err?.error?.message ?? `API error ${response.status}`);
    }

    if (body && typeof body === "object" && "data" in body) {
      return (body as ApiSuccess<T>).data;
    }

    return body as T;
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = this.options.getRefreshToken?.();
    if (!refreshToken) {
      return false;
    }

    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        try {
          const response = await fetch(`${this.options.baseUrl}${API_ROUTES.auth.refresh}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            return false;
          }

          const body = (await response.json()) as ApiSuccess<{
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
          }>;

          this.options.onTokensRefreshed?.(body.data);
          return true;
        } catch {
          return false;
        } finally {
          this.refreshPromise = null;
        }
      })();
    }

    return this.refreshPromise;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, data?: unknown) {
    return this.request<T>(path, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(path: string, data?: unknown) {
    return this.request<T>(path, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export function createApiClient(options: ApiClientOptions) {
  return new ApiClient(options);
}
