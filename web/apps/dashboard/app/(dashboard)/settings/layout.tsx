"use client";

import type { ReactNode } from "react";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { workspace } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
      {/* Page header */}
      <div className="mb-5 flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/20">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-charcoal dark:text-white">
            Settings
          </h1>
          <p className="text-xs text-ink-muted">
            Manage your workspace, team and chat widget.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="space-y-3">
          <SettingsTabs />

          {workspace?.name && (
            <div className="hidden items-center gap-2.5 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-line lg:flex dark:bg-charcoal-soft dark:ring-charcoal-muted">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold uppercase text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                {workspace.name.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-charcoal dark:text-white">
                  {workspace.name}
                </p>
                {workspace.role && (
                  <p className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                    {workspace.role}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
