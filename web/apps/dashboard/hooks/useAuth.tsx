"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  createWorkspace,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  type LoginResponse,
  type RegisterRequest,
  type User,
  type Workspace,
} from "@supportflow/api-client";
import { Dialog } from "@supportflow/ui";
import { api, clearSessionCookies, persistSessionCookies } from "@/lib/api";
import { notifySessionExpired, onSessionExpired, resetSessionExpiredFlag } from "@/lib/session-events";

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
  register: (payload: RegisterRequest) => Promise<void>;
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

function persistAuth(response: LoginResponse) {
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

function readJwtExpiryMs(accessToken: string): number | null {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

function endAccessSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(WORKSPACE_KEY);
  // Keep sf_session until the user clicks OK so middleware does not steal the redirect.
  notifySessionExpired();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionExpiredOpen, setSessionExpiredOpen] = useState(false);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = readStoredAuth();
    setUser(stored.user);
    setWorkspace(stored.workspace);

    if (stored.user && localStorage.getItem(ACCESS_TOKEN_KEY)) {
      persistSessionCookies("", 0);
    }
  }, []);

  useEffect(() => {
    return onSessionExpired(() => {
      setSessionExpiredOpen(true);
    });
  }, []);

  // Hard 1-minute access session: when the JWT expires, show modal (no silent refresh).
  useEffect(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }

    if (!user || sessionExpiredOpen) {
      return;
    }

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      return;
    }

    const expiresAt = readJwtExpiryMs(accessToken);
    const delay = expiresAt != null ? Math.max(expiresAt - Date.now(), 0) : 60_000;

    expiryTimerRef.current = setTimeout(() => {
      endAccessSession();
    }, delay);

    return () => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
      }
    };
  }, [user, sessionExpiredOpen]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await loginRequest(api, { email, password });
      resetSessionExpiredFlag();
      persistAuth(response);
      setUser(response.user);
      setWorkspace(response.workspace);
      setSessionExpiredOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response = await registerRequest(api, payload);
      resetSessionExpiredFlag();
      persistAuth(response);
      setUser(response.user);
      setWorkspace(response.workspace);
      setSessionExpiredOpen(false);

      try {
        const details = await createWorkspace(api, {
          name: payload.workspaceName,
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
        logout,
      }}
    >
      {children}
      <Dialog
        open={sessionExpiredOpen}
        title="Your desk shift ended"
        description="SupportFlow paused your session for security — your 1-minute login window ran out. Sign in again to continue."
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
