import { createApiClient } from "@supportflow/api-client";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api/v1";

const ACCESS_TOKEN_KEY = "sf_access_token";

export function getApiClient() {
  return createApiClient({
    baseUrl,
    getAccessToken: () => {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    },
    onUnauthorized: () => {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    },
  });
}

export const api = getApiClient();
