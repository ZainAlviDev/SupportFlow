"use client";

import type { ReactNode } from "react";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { workspace } = useAuth();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal dark:text-white">
            Settings
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage your workspace, team, and chat widget.
          </p>
        </div>
        {workspace?.name && (
          <div className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 dark:border-charcoal-muted dark:bg-charcoal">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold uppercase text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
              {workspace.name.slice(0, 1)}
            </span>
            <span className="text-xs font-medium text-ink dark:text-white">{workspace.name}</span>
            {workspace.role && (
              <span className="rounded-full bg-line-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted dark:bg-charcoal-soft">
                {workspace.role}
              </span>
            )}
          </div>
        )}
      </div>

      <SettingsTabs />
      <div className="mt-6">{children}</div>
    </div>
  );
}
