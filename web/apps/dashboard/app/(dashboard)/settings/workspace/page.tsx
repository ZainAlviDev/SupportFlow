"use client";

import { WorkspaceSettingsForm } from "@/components/settings/WorkspaceSettingsForm";

export default function WorkspaceSettingsPage() {
  return (
    <div>
      <p className="mb-4 text-sm text-ink-muted">Update your workspace name and timezone.</p>
      <WorkspaceSettingsForm />
    </div>
  );
}
