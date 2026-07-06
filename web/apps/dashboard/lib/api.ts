import { createApiClient } from "@supportflow/api-client";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api/v1";

export function getApiClient() {
  return createApiClient({
    baseUrl,
    getAccessToken: () => {
      if (typeof window === "undefined") return null;
      return localStorage.getItem("sf_access_token");
    },
    onUnauthorized: () => {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    },
  });
}

export const api = getApiClient();
