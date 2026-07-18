"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getCurrentWorkspace,
  updateCurrentWorkspace,
  updateTenant,
  type WorkspaceDetails,
} from "@supportflow/api-client";
import { Button, Input, Label } from "@supportflow/ui";
import { AiLoader } from "@/components/ui/AiLoader";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { canManageWorkspace } from "@/lib/workspaceAccess";
import {
  TIMEZONE_OPTIONS,
  workspaceSettingsSchema,
  type WorkspaceSettingsFormValues,
} from "@/lib/validations/workspace";

const selectClassName =
  "h-11 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-charcoal-muted dark:bg-charcoal dark:text-ink";

export function WorkspaceSettingsForm() {
  const { workspace: authWorkspace, setWorkspace: setAuthWorkspace } = useAuth();
  const [details, setDetails] = useState<WorkspaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const editable = canManageWorkspace(authWorkspace?.role);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<WorkspaceSettingsFormValues>({
    resolver: zodResolver(workspaceSettingsSchema),
    defaultValues: { name: "", timezone: "UTC" },
    mode: "onBlur",
  });

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const current = await getCurrentWorkspace(api);
        if (!active) return;
        setDetails(current);
        const tz = current.timezone?.trim() || "UTC";
        reset({
          name: current.name,
          timezone: (TIMEZONE_OPTIONS as readonly string[]).includes(tz) ? tz : "UTC",
        });
      } catch (err) {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : "Unable to load workspace.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [reset]);

  const onSubmit = async (values: WorkspaceSettingsFormValues) => {
    if (!editable) return;

    setApiError(null);
    setSuccess(null);

    try {
      const updated = await updateCurrentWorkspace(api, {
        name: values.name.trim(),
        timezone: values.timezone,
      });
      setDetails(updated);
      reset({ name: updated.name, timezone: updated.timezone });

      if (values.name.trim() !== authWorkspace?.name) {
        const tenant = await updateTenant(api, { name: updated.name });
        setAuthWorkspace(tenant);
      } else if (authWorkspace) {
        setAuthWorkspace({
          ...authWorkspace,
          name: updated.name,
          slug: updated.slug,
          id: updated.id,
        });
      }

      setSuccess("Workspace updated.");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unable to update workspace.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <AiLoader size="sm" label="Loading workspace" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {loadError}
      </div>
    );
  }

  const timezoneValue = details?.timezone?.trim() || "UTC";
  const timezoneChoices = (TIMEZONE_OPTIONS as readonly string[]).includes(timezoneValue)
    ? TIMEZONE_OPTIONS
    : ([timezoneValue, ...TIMEZONE_OPTIONS] as string[]);

  const planLabel = details?.plan?.trim() || "free";
  const initial = (details?.name ?? "W").slice(0, 1).toUpperCase();

  const stats = [
    {
      label: "Workspace",
      value: details?.name ?? "—",
      icon: (
        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2ZM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      ),
      tone: "text-brand-600 bg-brand-50 dark:text-brand-300 dark:bg-brand-500/15",
    },
    {
      label: "Plan",
      value: planLabel,
      icon: (
        <path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />
      ),
      tone: "text-sky-600 bg-sky-50 dark:text-sky-300 dark:bg-sky-500/15",
    },
    {
      label: "Timezone",
      value: (details?.timezone ?? "UTC").replaceAll("_", " "),
      icon: (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </>
      ),
      tone: "text-violet-600 bg-violet-50 dark:text-violet-300 dark:bg-violet-500/15",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Overview stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line dark:bg-charcoal dark:ring-charcoal-muted"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                {stat.icon}
              </svg>
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold capitalize leading-tight text-charcoal dark:text-white">
                {stat.value}
              </p>
              <p className="text-xs text-ink-muted">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid items-stretch gap-4 xl:grid-cols-2">
        {/* Profile form */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line dark:bg-charcoal dark:ring-charcoal-muted">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2ZM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
            </span>
            <div>
              <h2 className="text-sm font-semibold text-charcoal dark:text-white">
                Workspace profile
              </h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Name appears in the header and invite emails. Timezone is used for schedule
                displays.
              </p>
            </div>
          </div>

          {!editable && (
            <div className="mt-4 rounded-lg border border-line bg-surface-soft px-3 py-2 text-sm text-ink-muted dark:border-charcoal-muted">
              Only Owners and Admins can change workspace settings.
            </div>
          )}

          {apiError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {apiError}
            </div>
          )}
          {success && (
            <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
            <div>
              <Label htmlFor="workspaceName">Workspace name</Label>
              <Input
                id="workspaceName"
                disabled={!editable}
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                className={selectClassName}
                disabled={!editable}
                aria-invalid={Boolean(errors.timezone)}
                {...register("timezone")}
              >
                {timezoneChoices.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
              {errors.timezone && (
                <p className="mt-1.5 text-xs text-red-600">{errors.timezone.message}</p>
              )}
            </div>

            {editable && (
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            )}
          </form>
        </section>

        {/* Details + tips column */}
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line dark:bg-charcoal dark:ring-charcoal-muted">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white shadow-sm">
                {initial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-charcoal dark:text-white">
                  {details?.name}
                </p>
                <p className="text-xs text-ink-muted">
                  {authWorkspace?.role ? `${authWorkspace.role} access` : "Workspace details"}
                </p>
              </div>
            </div>

            <dl className="mt-4 space-y-3 rounded-xl border border-line p-3.5 dark:border-charcoal-muted">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-xs text-ink-muted">Slug</dt>
                <dd className="truncate font-mono text-xs font-medium text-charcoal dark:text-white">
                  {details?.slug ?? "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line pt-3 dark:border-charcoal-muted">
                <dt className="text-xs text-ink-muted">Plan</dt>
                <dd>
                  <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                    {planLabel}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line pt-3 dark:border-charcoal-muted">
                <dt className="text-xs text-ink-muted">Timezone</dt>
                <dd className="truncate text-xs font-medium text-charcoal dark:text-white">
                  {(details?.timezone ?? "UTC").replaceAll("_", " ")}
                </dd>
              </div>
            </dl>
          </section>

          <section className="flex-1 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line dark:bg-charcoal dark:ring-charcoal-muted">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M9 18h6m-5 4h4M12 2a7 7 0 0 0-4 12.7c.6.4 1 1.1 1 1.8V17h6v-.5c0-.7.4-1.4 1-1.8A7 7 0 0 0 12 2z" />
                </svg>
              </span>
              <div>
                <h2 className="text-sm font-semibold text-charcoal dark:text-white">Good to know</h2>
                <p className="mt-0.5 text-xs text-ink-muted">Keep your workspace details tidy.</p>
              </div>
            </div>
            <ul className="mt-4 space-y-3">
              {[
                "Workspace name shows in the top bar and invite emails.",
                "Timezone affects how dates appear across the desk.",
                "Slug is used in URLs and can’t be changed from here.",
              ].map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-soft dark:text-ink-faint"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 shrink-0 text-brand-500"
                    aria-hidden
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
