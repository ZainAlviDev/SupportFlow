"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Button, Dialog } from "@supportflow/ui";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
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
      <header className="flex h-16 items-center justify-between gap-3 border-b border-line bg-white px-4 sm:px-6 dark:border-charcoal-muted dark:bg-charcoal-soft">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-ink-soft hover:bg-surface-soft hover:text-ink lg:hidden dark:text-ink-faint dark:hover:bg-charcoal-soft"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
          <Link
            href="/settings/workspace"
            className="group min-w-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Workspace</p>
            <p className="truncate font-semibold text-charcoal transition-colors group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
              {workspace?.name ?? "My Workspace"}
            </p>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/settings/workspace"
            className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:inline dark:text-ink-faint dark:hover:text-white"
          >
            Settings
          </Link>
          <ThemeToggle />
          <div className="hidden text-right sm:block">
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
