"use client";

import { useEffect, useState } from "react";
import {
  getCurrentWorkspace,
  updateCurrentWorkspace,
  type BusinessHoursDay,
} from "@supportflow/api-client";
import { Button, Input, Label } from "@supportflow/ui";
import { AiLoader } from "@/components/ui/AiLoader";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { canManageWorkspace } from "@/lib/workspaceAccess";
import { TIMEZONE_OPTIONS } from "@/lib/validations/workspace";
import { normalizeBusinessHours } from "@/lib/workspaceSettings";

const selectClassName =
  "h-11 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-charcoal-muted dark:bg-charcoal dark:text-ink";

export function BusinessHoursEditor() {
  const { workspace: authWorkspace } = useAuth();
  const editable = canManageWorkspace(authWorkspace?.role);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [timezone, setTimezone] = useState("UTC");
  const [offlineMessage, setOfflineMessage] = useState("");
  const [days, setDays] = useState<BusinessHoursDay[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const current = await getCurrentWorkspace(api);
        if (!active) return;
        const hours = normalizeBusinessHours(current.businessHours, current.timezone || "UTC");
        setEnabled(Boolean(hours.enabled));
        setTimezone(hours.timezone || current.timezone || "UTC");
        setOfflineMessage(hours.offlineMessage || "");
        setDays(hours.days || []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load business hours.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const updateDay = (dayName: string, patch: Partial<BusinessHoursDay>) => {
    setDays((current) =>
      current.map((day) => (day.day === dayName ? { ...day, ...patch } : day)),
    );
  };

  const onSave = async () => {
    if (!editable) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateCurrentWorkspace(api, {
        businessHours: {
          enabled,
          timezone,
          offlineMessage: offlineMessage.trim(),
          days,
        },
      });
      const hours = normalizeBusinessHours(updated.businessHours, updated.timezone || "UTC");
      setEnabled(Boolean(hours.enabled));
      setTimezone(hours.timezone || updated.timezone || "UTC");
      setOfflineMessage(hours.offlineMessage || "");
      setDays(hours.days || []);
      setSuccess("Business hours saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save business hours.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <AiLoader size="sm" label="Loading business hours" />
      </div>
    );
  }

  const timezoneChoices = (TIMEZONE_OPTIONS as readonly string[]).includes(timezone)
    ? TIMEZONE_OPTIONS
    : ([timezone, ...TIMEZONE_OPTIONS] as string[]);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line dark:bg-charcoal dark:ring-charcoal-muted">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-charcoal dark:text-white">Business hours</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Weekly schedule used for agent availability messaging.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-soft dark:text-ink-faint">
          <input
            type="checkbox"
            checked={enabled}
            disabled={!editable}
            onChange={(event) => setEnabled(event.target.checked)}
            className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
          />
          Enforce hours
        </label>
      </div>

      {!editable && (
        <div className="mt-4 rounded-lg border border-line bg-surface-soft px-3 py-2 text-sm text-ink-muted dark:border-charcoal-muted">
          Only Owners and Admins can change business hours.
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

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="businessTimezone">Schedule timezone</Label>
          <select
            id="businessTimezone"
            className={selectClassName}
            disabled={!editable}
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
          >
            {timezoneChoices.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="offlineMessage">Offline message</Label>
          <Input
            id="offlineMessage"
            disabled={!editable}
            value={offlineMessage}
            onChange={(event) => setOfflineMessage(event.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {days.map((day) => (
          <div
            key={day.day}
            className="grid grid-cols-1 items-center gap-2 rounded-xl border border-line px-3 py-2.5 sm:grid-cols-[140px_auto_1fr_1fr] dark:border-charcoal-muted"
          >
            <label className="flex items-center gap-2 text-sm font-medium text-charcoal dark:text-white">
              <input
                type="checkbox"
                checked={day.isOpen}
                disabled={!editable}
                onChange={(event) => updateDay(day.day, { isOpen: event.target.checked })}
                className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
              />
              {day.day}
            </label>
            <span className="text-xs text-ink-muted">{day.isOpen ? "Open" : "Closed"}</span>
            <Input
              type="time"
              disabled={!editable || !day.isOpen}
              value={day.open ?? "09:00"}
              onChange={(event) => updateDay(day.day, { open: event.target.value })}
            />
            <Input
              type="time"
              disabled={!editable || !day.isOpen}
              value={day.close ?? "17:00"}
              onChange={(event) => updateDay(day.day, { close: event.target.value })}
            />
          </div>
        ))}
      </div>

      {editable && (
        <div className="mt-4">
          <Button type="button" disabled={saving} onClick={() => void onSave()}>
            {saving ? "Saving..." : "Save business hours"}
          </Button>
        </div>
      )}
    </section>
  );
}
