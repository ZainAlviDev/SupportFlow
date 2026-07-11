import type { ApiClient } from "./client";
import { API_ROUTES } from "./routes";
import type {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  MeResponse,
  RefreshTokenRequest,
  RegisterRequest,
} from "./types";

export async function login(client: ApiClient, credentials: LoginRequest): Promise<LoginResponse> {
  return client.post<LoginResponse>(API_ROUTES.auth.login, credentials);
}

export async function register(
  client: ApiClient,
  payload: RegisterRequest,
): Promise<LoginResponse> {
  return client.post<LoginResponse>(API_ROUTES.auth.register, payload);
}

export async function refresh(
  client: ApiClient,
  payload: RefreshTokenRequest,
): Promise<LoginResponse> {
  return client.post<LoginResponse>(API_ROUTES.auth.refresh, payload);
}

export async function logout(client: ApiClient, payload: LogoutRequest): Promise<void> {
  await client.post<null>(API_ROUTES.auth.logout, payload);
}

export async function me(client: ApiClient): Promise<MeResponse> {
  return client.get<MeResponse>(API_ROUTES.auth.me);
}
