"use client";

import type { ReactNode } from "react";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { workspace } = useAuth();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-charcoal dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {workspace?.name ? (
            <>
              Managing <span className="font-medium text-ink-soft">{workspace.name}</span>
              {workspace.role ? (
                <span className="text-ink-faint"> · {workspace.role}</span>
              ) : null}
            </>
          ) : (
            "Manage your workspace, team, and chat widget."
          )}
        </p>
      </div>
      <SettingsTabs />
      <div className="mt-6">{children}</div>
    </div>
  );
}
