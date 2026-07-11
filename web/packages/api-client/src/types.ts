/** Shared API response envelope (docs §8.9) */

export type ApiSuccess<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message?: string }> | Record<string, unknown>;
  };
};

export type User = {
  id: string;
  email: string;
  fullName: string;
};

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  fullName: string;
  workspaceName: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type LogoutRequest = {
  refreshToken: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
  workspace: Workspace;
};

export type MeResponse = {
  user: User;
  workspace: Workspace;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};
