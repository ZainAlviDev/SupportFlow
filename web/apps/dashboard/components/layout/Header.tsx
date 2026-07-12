"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Button, Dialog } from "@supportflow/ui";

export function Header() {
  const { user, workspace, logout } = useAuth();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setConfirmOpen(false);
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-line bg-white px-6 dark:border-charcoal-muted dark:bg-charcoal-soft">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Workspace</p>
          <p className="font-semibold text-charcoal dark:text-white">{workspace?.name ?? "My Workspace"}</p>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="text-right">
            <p className="text-sm font-semibold text-charcoal dark:text-white">{user?.fullName ?? "Agent"}</p>
            <p className="text-xs text-ink-muted">{user?.email ?? "agent@example.com"}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>
            Logout
          </Button>
        </div>
      </header>

      <Dialog
        open={confirmOpen}
        title="Leave the desk?"
        description="You’re about to sign out of SupportFlow. Open conversations stay in the workspace — you’ll need to sign in again to jump back in."
        primaryLabel="Yes, log out"
        secondaryLabel="Stay signed in"
        primaryVariant="primary"
        busy={loggingOut}
        onPrimary={handleConfirmLogout}
        onSecondary={() => setConfirmOpen(false)}
      />
    </>
  );
}
