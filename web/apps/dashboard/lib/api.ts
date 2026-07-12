import { createApiClient } from "@supportflow/api-client";
import { notifySessionExpired, resetSessionExpiredFlag } from "@/lib/session-events";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api/v1";

const ACCESS_TOKEN_KEY = "sf_access_token";
const REFRESH_TOKEN_KEY = "sf_refresh_token";
const USER_KEY = "sf_user";
const WORKSPACE_KEY = "sf_workspace";

/** Keeps middleware from hard-redirecting before the expiry modal is confirmed. */
const SESSION_COOKIE = "sf_session";
/** Slightly longer than the 1-minute access token so the modal can appear first. */
const SESSION_MAX_AGE_SECONDS = 60 * 5;

export function persistSessionCookies(_accessToken: string, _expiresIn: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearSessionCookies() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = "sf_access_token=; path=/; max-age=0; SameSite=Lax";
}

function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(WORKSPACE_KEY);
}

export function getApiClient() {
  return createApiClient({
    baseUrl,
    // 1-minute access token = hard session end (no silent refresh).
    autoRefresh: false,
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
      resetSessionExpiredFlag();
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      persistSessionCookies(tokens.accessToken, tokens.expiresIn);
    },
    onUnauthorized: () => {
      if (typeof window === "undefined") return;
      clearStoredTokens();
      notifySessionExpired();
    },
  });
}

export const api = getApiClient();
