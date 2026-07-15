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
import { Button, Card, CardContent, Input, Label } from "@supportflow/ui";
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
    return <div className="text-sm text-ink-muted">Loading workspace...</div>;
  }

  if (loadError) {
    return (
      <div className="max-w-xl rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {loadError}
      </div>
    );
  }

  const timezoneValue = details?.timezone?.trim() || "UTC";
  const timezoneChoices = (TIMEZONE_OPTIONS as readonly string[]).includes(timezoneValue)
    ? TIMEZONE_OPTIONS
    : ([timezoneValue, ...TIMEZONE_OPTIONS] as string[]);

  return (
    <Card className="max-w-xl dark:border-charcoal-muted dark:bg-charcoal">
      <CardContent className="space-y-4 py-6">
        <div>
          <h2 className="text-sm font-semibold text-charcoal dark:text-white">Workspace profile</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Name appears in the header and invite emails. Timezone is used for schedule displays.
          </p>
        </div>

        {!editable && (
          <div className="rounded-lg border border-line bg-surface-soft px-3 py-2 text-sm text-ink-muted dark:border-charcoal-muted">
            Only Owners and Admins can change workspace settings.
          </div>
        )}

        {apiError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {apiError}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="workspaceName">Workspace name</Label>
            <Input
              id="workspaceName"
              disabled={!editable}
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>}
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

          {details && (
            <p className="text-xs text-ink-faint">
              Slug: <span className="font-medium text-ink-soft">{details.slug}</span> · Plan:{" "}
              <span className="font-medium text-ink-soft">{details.plan}</span>
            </p>
          )}

          {editable && (
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
