"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@supportflow/ui";

export function Header() {
  const { user, workspace, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-line bg-white px-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Workspace</p>
        <p className="font-semibold text-charcoal">{workspace?.name ?? "My Workspace"}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-charcoal">{user?.fullName ?? "Agent"}</p>
          <p className="text-xs text-ink-muted">{user?.email ?? "agent@example.com"}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
