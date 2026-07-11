import { createApiClient } from "@supportflow/api-client";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api/v1";

const ACCESS_TOKEN_KEY = "sf_access_token";
const REFRESH_TOKEN_KEY = "sf_refresh_token";
const USER_KEY = "sf_user";
const WORKSPACE_KEY = "sf_workspace";

export function persistSessionCookies(accessToken: string, expiresIn: number) {
  if (typeof document === "undefined") return;
  document.cookie = `sf_access_token=${encodeURIComponent(accessToken)}; path=/; max-age=${Math.max(expiresIn, 60)}; SameSite=Lax`;
}

export function clearSessionCookies() {
  if (typeof document === "undefined") return;
  document.cookie = "sf_access_token=; path=/; max-age=0; SameSite=Lax";
}

export function getApiClient() {
  return createApiClient({
    baseUrl,
    getAccessToken: () => {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    },
    getRefreshToken: () => {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    },
    onTokensRefreshed: (tokens) => {
      if (typeof window === "undefined") return;
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      persistSessionCookies(tokens.accessToken, tokens.expiresIn);
    },
    onUnauthorized: () => {
      if (typeof window === "undefined") return;
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(WORKSPACE_KEY);
      clearSessionCookies();
      window.location.href = "/login";
    },
  });
}

export const api = getApiClient();
