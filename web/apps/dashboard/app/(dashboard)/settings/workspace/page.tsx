"use client";

import { useEffect, useState } from "react";
import {
  getCurrentWorkspace,
  updateCurrentWorkspace,
  type WorkspaceDetails,
} from "@supportflow/api-client";
import { api } from "@/lib/api";
import { Button, Card, CardContent, Input, Label } from "@supportflow/ui";

export default function WorkspaceSettingsPage() {
  const [workspace, setWorkspace] = useState<WorkspaceDetails | null>(null);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const current = await getCurrentWorkspace(api);
        if (!active) return;
        setWorkspace(current);
        setName(current.name);
        setTimezone(current.timezone);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load workspace.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const onSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const updated = await updateCurrentWorkspace(api, { name, timezone });
      setWorkspace(updated);
      setMessage("Workspace updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update workspace.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-ink-muted">Loading workspace...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-charcoal">Workspace Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">Update your workspace name and timezone.</p>
      </div>

      <Card className="max-w-xl">
        <CardContent className="space-y-4 py-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700">
              {message}
            </div>
          )}

          <form onSubmit={onSave} className="space-y-4">
            <div>
              <Label htmlFor="workspaceName">Workspace name</Label>
              <Input
                id="workspaceName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="UTC"
                required
              />
            </div>
            {workspace && (
              <p className="text-xs text-ink-faint">
                Slug: <span className="font-medium text-ink-soft">{workspace.slug}</span> · Plan:{" "}
                <span className="font-medium text-ink-soft">{workspace.plan}</span>
              </p>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
