"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteMember } from "@supportflow/api-client";
import { Button, Card, CardContent, Input, Label } from "@supportflow/ui";
import { api } from "@/lib/api";
import {
  INVITE_ROLES,
  inviteMemberSchema,
  type InviteMemberFormValues,
} from "@/lib/validations/team";

type InviteMemberFormProps = {
  onInvited?: () => void | Promise<void>;
};

export function InviteMemberForm({ onInvited }: InviteMemberFormProps) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "Agent",
    },
    mode: "onBlur",
  });

  const selectedRole = watch("role");

  const onSubmit = async (values: InviteMemberFormValues) => {
    setApiError(null);
    setSuccess(null);

    try {
      const invited = await inviteMember(api, {
        email: values.email.trim(),
        role: values.role,
      });
      setSuccess(`Invitation sent to ${invited.email}. They can join from the email link.`);
      reset({ email: "", role: "Agent" });
      await onInvited?.();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unable to send invitation.");
    }
  };

  return (
    <Card className="dark:border-charcoal-muted dark:bg-charcoal">
      <CardContent className="space-y-4 py-6">
        <div>
          <h2 className="text-sm font-semibold text-charcoal dark:text-white">Invite member</h2>
          <p className="mt-1 text-xs text-ink-muted">
            They&apos;ll receive an email with a link to join this workspace.
          </p>
        </div>

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
            <Label htmlFor="inviteEmail">Email</Label>
            <Input
              id="inviteEmail"
              type="email"
              autoComplete="email"
              placeholder="agent@company.com"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <fieldset className="space-y-2">
            <Legend>Role</Legend>
            {INVITE_ROLES.map((role) => {
              const checked = selectedRole === role.value;
              return (
                <label
                  key={role.value}
                  className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-2.5 transition ${
                    checked
                      ? "border-brand-500 bg-brand-50/60 dark:border-brand-500 dark:bg-brand-500/10"
                      : "border-line hover:border-ink-faint dark:border-charcoal-muted"
                  }`}
                >
                  <input
                    type="radio"
                    className="mt-1"
                    value={role.value}
                    checked={checked}
                    onChange={() =>
                      setValue("role", role.value, { shouldValidate: true, shouldDirty: true })
                    }
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-charcoal dark:text-white">
                      {role.label}
                    </span>
                    <span className="block text-xs text-ink-muted">{role.description}</span>
                  </span>
                </label>
              );
            })}
            {errors.role && <p className="text-xs text-red-600">{errors.role.message}</p>}
          </fieldset>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending invite..." : "Send invitation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Legend({ children }: { children: ReactNode }) {
  return (
    <legend className="mb-1.5 block text-sm font-semibold text-ink-soft">{children}</legend>
  );
}
