"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  createWorkspace,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  verifyEmail as verifyEmailRequest,
  type LoginResponse,
  type RegisterRequest,
  type RegisterResponse,
  type User,
  type Workspace,
} from "@supportflow/api-client";
import { Dialog } from "@supportflow/ui";
import { api, clearSessionCookies, persistSessionCookies } from "@/lib/api";
import { onSessionExpired, resetSessionExpiredFlag } from "@/lib/session-events";

const ACCESS_TOKEN_KEY = "sf_access_token";
const REFRESH_TOKEN_KEY = "sf_refresh_token";
const USER_KEY = "sf_user";
const WORKSPACE_KEY = "sf_workspace";

type AuthContextValue = {
  user: User | null;
  workspace: Workspace | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<RegisterResponse>;
  verifyEmail: (email: string, code: string, workspaceName?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): { user: User | null; workspace: Workspace | null } {
  if (typeof window === "undefined") {
    return { user: null, workspace: null };
  }

  try {
    const userRaw = localStorage.getItem(USER_KEY);
    const workspaceRaw = localStorage.getItem(WORKSPACE_KEY);

    return {
      user: userRaw ? (JSON.parse(userRaw) as User) : null,
      workspace: workspaceRaw ? (JSON.parse(workspaceRaw) as Workspace) : null,
    };
  } catch {
    return { user: null, workspace: null };
  }
}

function readJwtExpiryMs(accessToken: string): number | null {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return null;
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const json = JSON.parse(atob(padded + pad)) as { exp?: number };
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

function persistAuth(response: LoginResponse) {
  resetSessionExpiredFlag();
  localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(response.workspace));
  persistSessionCookies(response.accessToken, response.expiresIn);
}

function clearAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(WORKSPACE_KEY);
  clearSessionCookies();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionExpiredOpen, setSessionExpiredOpen] = useState(false);

  useEffect(() => {
    const stored = readStoredAuth();
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const expiresAt = accessToken ? readJwtExpiryMs(accessToken) : null;
    const stillValid =
      Boolean(stored.user && accessToken) && (expiresAt == null || expiresAt > Date.now());

    if (stillValid) {
      setUser(stored.user);
      setWorkspace(stored.workspace);
      persistSessionCookies(accessToken!, Math.max(0, Math.floor(((expiresAt ?? Date.now()) - Date.now()) / 1000)));
    } else {
      clearAuth();
      resetSessionExpiredFlag();
      setUser(null);
      setWorkspace(null);
    }
  }, []);

  useEffect(() => {
    return onSessionExpired(() => {
      setSessionExpiredOpen(true);
      setUser(null);
      setWorkspace(null);
    });
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await loginRequest(api, { email, password });
      persistAuth(response);
      setSessionExpiredOpen(false);
      setUser(response.user);
      setWorkspace(response.workspace);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterRequest): Promise<RegisterResponse> => {
    setIsLoading(true);
    try {
      return await registerRequest(api, payload);
    } finally {
      setIsLoading(false);
    }
  };

  const completeLogin = async (response: LoginResponse, workspaceName?: string) => {
    persistAuth(response);
    setSessionExpiredOpen(false);
    setUser(response.user);
    setWorkspace(response.workspace);

    if (!workspaceName?.trim()) {
      return;
    }

    try {
      const details = await createWorkspace(api, {
        name: workspaceName.trim(),
        timezone: "UTC",
      });

      const workspaceState: Workspace = {
        id: details.id,
        name: details.name,
        slug: details.slug,
        role: response.workspace.role,
      };

      localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspaceState));
      setWorkspace(workspaceState);
    } catch (workspaceError) {
      console.warn("Workspace profile create skipped:", workspaceError);
    }
  };

  const verifyEmail = async (email: string, code: string, workspaceName?: string) => {
    setIsLoading(true);
    try {
      const response = await verifyEmailRequest(api, { email, code });
      await completeLogin(response, workspaceName);
      clearAuth();
      setUser(null);
      setWorkspace(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      if (refreshToken) {
        await logoutRequest(api, { refreshToken });
      }
    } catch {
      // Always clear local session even if revoke fails.
    } finally {
      clearAuth();
      setUser(null);
      setWorkspace(null);
      resetSessionExpiredFlag();
    }
  };

  const handleSessionExpiredOk = () => {
    clearAuth();
    setUser(null);
    setWorkspace(null);
    setSessionExpiredOpen(false);
    resetSessionExpiredFlag();
    router.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
        verifyEmail,
        logout,
      }}
    >
      {children}
      <Dialog
        open={sessionExpiredOpen}
        title="Your session ended"
        description="SupportFlow signed you out because your authenticated request was rejected. Sign in again to continue."
        primaryLabel="Back to login"
        onPrimary={handleSessionExpiredOk}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
