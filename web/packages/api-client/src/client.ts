import { API_ROUTES } from "./routes";
import type { ApiError, ApiSuccess } from "./types";

export type ApiClientOptions = {
  baseUrl: string;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
};

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  get routes() {
    return API_ROUTES;
  }

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");

    const token = this.options.getAccessToken?.();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (response.status === 401) {
      this.options.onUnauthorized?.();
    }

    const body = await response.json();

    if (!response.ok) {
      const err = body as ApiError;
      throw new Error(err.error?.message ?? `API error ${response.status}`);
    }

    return (body as ApiSuccess<T>).data;
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
