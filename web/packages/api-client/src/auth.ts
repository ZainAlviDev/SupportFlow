import type { ApiClient } from "./client";
import { API_ROUTES } from "./routes";
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  MeResponse,
  RecoveryOptionsRequest,
  RecoveryOptionsResponse,
  RefreshTokenRequest,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  VerifyEmailRequest,
  InvitePreviewResponse,
  AcceptInviteRequest,
  VerifyResetOtpRequest,
  VerifyResetOtpResponse,
  Workspace,
} from "./types";

export async function login(client: ApiClient, credentials: LoginRequest): Promise<LoginResponse> {
  return client.post<LoginResponse>(API_ROUTES.auth.login, credentials);
}

export async function register(
  client: ApiClient,
  payload: RegisterRequest,
): Promise<RegisterResponse> {
  return client.post<RegisterResponse>(API_ROUTES.auth.register, payload);
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

export async function updateTenant(
  client: ApiClient,
  payload: { name: string },
): Promise<Workspace> {
  return client.patch<Workspace>(API_ROUTES.auth.tenant, payload);
}

export async function getRecoveryOptions(
  client: ApiClient,
  payload: RecoveryOptionsRequest,
): Promise<RecoveryOptionsResponse> {
  return client.post<RecoveryOptionsResponse>(API_ROUTES.auth.recoveryOptions, payload);
}

export async function forgotPassword(
  client: ApiClient,
  payload: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  return client.post<ForgotPasswordResponse>(API_ROUTES.auth.forgotPassword, payload);
}

export async function verifyResetOtp(
  client: ApiClient,
  payload: VerifyResetOtpRequest,
): Promise<VerifyResetOtpResponse> {
  return client.post<VerifyResetOtpResponse>(API_ROUTES.auth.verifyResetOtp, payload);
}

export async function resetPassword(
  client: ApiClient,
  payload: ResetPasswordRequest,
): Promise<void> {
  await client.post<null>(API_ROUTES.auth.resetPassword, payload);
}

export async function verifyEmail(
  client: ApiClient,
  payload: VerifyEmailRequest,
): Promise<LoginResponse> {
  return client.post<LoginResponse>(API_ROUTES.auth.verifyEmail, payload);
}

export async function previewInvite(
  client: ApiClient,
  token: string,
): Promise<InvitePreviewResponse> {
  const query = new URLSearchParams({ token });
  return client.get<InvitePreviewResponse>(`${API_ROUTES.auth.invitePreview}?${query.toString()}`);
}

export async function acceptInvite(
  client: ApiClient,
  payload: AcceptInviteRequest,
): Promise<LoginResponse> {
  return client.post<LoginResponse>(API_ROUTES.auth.acceptInvite, payload);
}
