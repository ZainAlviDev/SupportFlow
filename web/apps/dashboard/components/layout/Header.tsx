"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@supportflow/ui";

export function Header() {
  const { user, workspace, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <p className="text-sm text-slate-500">Workspace</p>
        <p className="font-medium text-slate-900">{workspace?.name ?? "My Workspace"}</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          title="Toggle theme (Module 1)"
        >
          🌙
        </button>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{user?.fullName ?? "Agent"}</p>
          <p className="text-xs text-slate-500">{user?.email ?? "agent@example.com"}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
