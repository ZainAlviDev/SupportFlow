"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { Dialog } from "@supportflow/ui";

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function initialsOf(name: string | undefined | null) {
  if (!name) return "A";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, workspace, logout } = useAuth();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

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
      <header className="relative flex h-[68px] items-center justify-between gap-3 overflow-visible border-b border-brand-200 bg-gradient-to-r from-brand-100 via-brand-50 to-emerald-50 px-4 sm:px-6 dark:border-charcoal-muted dark:from-brand-500/20 dark:via-charcoal-soft dark:to-brand-500/10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 78% 0%, rgba(16,185,129,0.16), transparent 42%), radial-gradient(circle at 12% 110%, rgba(16,185,129,0.12), transparent 38%)",
          }}
          aria-hidden
        />
        {/* Left: mobile menu + section title */}
        <div className="relative flex min-w-0 items-center gap-3">
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

          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-lg font-bold tracking-tight text-charcoal dark:text-white">
              {greetingFor(new Date())}
              {user?.fullName ? (
                <>
                  , <span className="text-brand-600 dark:text-brand-300">{user.fullName.split(" ")[0]}</span>
                </>
              ) : null}
            </p>
            <p className="truncate text-xs text-ink-muted">
              {workspace?.name ? `${workspace.name} workspace` : "Your support desk"}
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="relative flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <NotificationBell />

          <span className="mx-1 hidden h-6 w-px bg-line sm:block dark:bg-charcoal-muted" aria-hidden />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-soft dark:hover:bg-charcoal-soft"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
                {initialsOf(user?.fullName)}
              </span>
              <span className="hidden max-w-[140px] truncate text-sm font-medium text-charcoal sm:block dark:text-white">
                {user?.fullName ?? "Agent"}
              </span>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`hidden text-ink-faint transition-transform sm:block ${menuOpen ? "rotate-180" : ""}`}
                aria-hidden
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-30 mt-1.5 w-56 overflow-hidden rounded-xl border border-line bg-white shadow-panel dark:border-charcoal-muted dark:bg-charcoal-soft"
              >
                <div className="border-b border-line px-3.5 py-3 dark:border-charcoal-muted">
                  <p className="truncate text-sm font-semibold text-charcoal dark:text-white">
                    {user?.fullName ?? "Agent"}
                  </p>
                  <p className="truncate text-xs text-ink-muted">{user?.email}</p>
                  {workspace?.name && (
                    <p className="mt-1 truncate text-[11px] text-ink-faint">
                      {workspace.name}
                      {workspace.role ? ` · ${workspace.role}` : ""}
                    </p>
                  )}
                </div>
                <div className="py-1.5">
                  <Link
                    href="/settings/workspace"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink-soft hover:bg-surface-soft hover:text-ink dark:text-ink-faint dark:hover:bg-charcoal-muted dark:hover:text-white"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                    </svg>
                    Workspace settings
                  </Link>
                  <Link
                    href="/settings/team"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink-soft hover:bg-surface-soft hover:text-ink dark:text-ink-faint dark:hover:bg-charcoal-muted dark:hover:text-white"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    Team
                  </Link>
                  <div className="my-1 border-t border-line dark:border-charcoal-muted" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <path d="m16 17 5-5-5-5M21 12H9" />
                    </svg>
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
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
