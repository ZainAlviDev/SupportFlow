import type { ApiClient } from "./client";
import { API_ROUTES } from "./routes";
import type { LoginRequest, LoginResponse } from "./types";

export async function login(client: ApiClient, credentials: LoginRequest): Promise<LoginResponse> {
  return client.post<LoginResponse>(API_ROUTES.auth.login, credentials);
}
