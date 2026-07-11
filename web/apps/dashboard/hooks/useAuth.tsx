"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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
import { api, clearSessionCookies, persistSessionCookies } from "@/lib/api";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stored = readStoredAuth();
    setUser(stored.user);
    setWorkspace(stored.workspace);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await loginRequest(api, { email, password });
      persistAuth(response);
      setUser(response.user);
      setWorkspace(response.workspace);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response = await registerRequest(api, payload);
      persistAuth(response);
      setUser(response.user);
      setWorkspace(response.workspace);

      // Best-effort: create Workspace profile for settings API.
      // Identity already created the tenant, so registration succeeds even if this fails.
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
    }
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
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
