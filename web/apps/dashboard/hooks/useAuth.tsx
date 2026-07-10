"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { login as loginRequest, type User, type Workspace } from "@supportflow/api-client";
import { api } from "@/lib/api";

const ACCESS_TOKEN_KEY = "sf_access_token";
const REFRESH_TOKEN_KEY = "sf_refresh_token";
const USER_KEY = "sf_user";
const WORKSPACE_KEY = "sf_workspace";

type AuthContextValue = {
  user: User | null;
  workspace: Workspace | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
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

function persistAuth(response: {
  accessToken: string;
  refreshToken: string;
  user: User;
  workspace: Workspace;
}) {
  localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(response.workspace));
}

function clearAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(WORKSPACE_KEY);
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

  const logout = () => {
    clearAuth();
    setUser(null);
    setWorkspace(null);
  };

  return (
    <AuthContext.Provider value={{ user, workspace, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
