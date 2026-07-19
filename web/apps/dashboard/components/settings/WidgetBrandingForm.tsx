"use client";

import { useEffect, useState } from "react";
import {
  getCurrentWorkspace,
  updateCurrentWorkspace,
  type WorkspaceDetails,
} from "@supportflow/api-client";
import { Button, Input, Label } from "@supportflow/ui";
import { AiLoader } from "@/components/ui/AiLoader";
import { WidgetPreview } from "@/components/settings/WidgetPreview";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { canManageWorkspace } from "@/lib/workspaceAccess";
import { isHexColor, normalizeWidgetSettings } from "@/lib/workspaceSettings";

export function WidgetBrandingForm() {
  const { workspace: authWorkspace } = useAuth();
  const editable = canManageWorkspace(authWorkspace?.role);
  const [details, setDetails] = useState<WorkspaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#10b981");
  const [position, setPosition] = useState<"bottom-left" | "bottom-right">("bottom-right");
  const [welcomeMessage, setWelcomeMessage] = useState("Hi! How can we help?");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const current = await getCurrentWorkspace(api);
        if (!active) return;
        setDetails(current);
        const widget = normalizeWidgetSettings(current.widget);
        setPrimaryColor(widget.primaryColor);
        setPosition(widget.position);
        setWelcomeMessage(widget.welcomeMessage);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load widget settings.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const onSave = async () => {
    if (!editable) return;
    if (!isHexColor(primaryColor)) {
      setError("Primary color must be a hex value like #10b981.");
      return;
    }
    if (!welcomeMessage.trim()) {
      setError("Welcome message is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateCurrentWorkspace(api, {
        widget: {
          primaryColor: primaryColor.trim(),
          position,
          welcomeMessage: welcomeMessage.trim(),
        },
      });
      setDetails(updated);
      const widget = normalizeWidgetSettings(updated.widget);
      setPrimaryColor(widget.primaryColor);
      setPosition(widget.position);
      setWelcomeMessage(widget.welcomeMessage);
      setSuccess("Widget branding saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save widget branding.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <AiLoader size="sm" label="Loading branding" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line dark:bg-charcoal dark:ring-charcoal-muted">
        <h2 className="text-sm font-semibold text-charcoal dark:text-white">Widget branding</h2>
        <p className="mt-0.5 text-xs text-ink-muted">
          Color, launcher side, and welcome message used by the embeddable chat widget.
        </p>

        {!editable && (
          <div className="mt-4 rounded-lg border border-line bg-surface-soft px-3 py-2 text-sm text-ink-muted dark:border-charcoal-muted">
            Only Owners and Admins can change widget branding.
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700">
            {success}
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="primaryColor">Primary color</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id="primaryColorPicker"
                type="color"
                value={isHexColor(primaryColor) ? primaryColor : "#10b981"}
                disabled={!editable}
                onChange={(event) => setPrimaryColor(event.target.value)}
                className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-white p-1 dark:border-charcoal-muted dark:bg-charcoal"
              />
              <Input
                id="primaryColor"
                value={primaryColor}
                disabled={!editable}
                onChange={(event) => setPrimaryColor(event.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="position">Launcher position</Label>
            <select
              id="position"
              disabled={!editable}
              value={position}
              onChange={(event) =>
                setPosition(event.target.value === "bottom-left" ? "bottom-left" : "bottom-right")
              }
              className="mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-charcoal-muted dark:bg-charcoal dark:text-ink"
            >
              <option value="bottom-right">Bottom right</option>
              <option value="bottom-left">Bottom left</option>
            </select>
          </div>

          <div>
            <Label htmlFor="welcomeMessage">Welcome message</Label>
            <textarea
              id="welcomeMessage"
              disabled={!editable}
              value={welcomeMessage}
              onChange={(event) => setWelcomeMessage(event.target.value)}
              rows={3}
              maxLength={300}
              className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-charcoal-muted dark:bg-charcoal dark:text-ink"
            />
          </div>

          {editable && (
            <Button type="button" disabled={saving} onClick={() => void onSave()}>
              {saving ? "Saving..." : "Save branding"}
            </Button>
          )}
        </div>
      </section>

      <WidgetPreview
        workspaceName={details?.name ?? authWorkspace?.name ?? "Support"}
        primaryColor={isHexColor(primaryColor) ? primaryColor : "#10b981"}
        position={position}
        welcomeMessage={welcomeMessage}
      />
    </div>
  );
}
