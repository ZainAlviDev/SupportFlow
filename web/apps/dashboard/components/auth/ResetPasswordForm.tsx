"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword } from "@supportflow/api-client";
import { SupportFlowLogo } from "@/components/brand/SupportFlowLogo";
import { api } from "@/lib/api";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validations/auth";
import { Button, Input, Label } from "@supportflow/ui";

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("token") ?? "";
  const [apiError, setApiError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setApiError(null);
    if (!resetToken) {
      setApiError("Missing reset token. Request a new recovery code.");
      return;
    }

    try {
      await resetPassword(api, {
        resetToken,
        newPassword: values.newPassword,
      });
      setDone(true);
      setTimeout(() => router.push("/login"), 1200);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unable to reset password.");
    }
  };

  return (
    <div>
      <SupportFlowLogo className="mb-10" />
      <h1 className="text-3xl font-bold tracking-tight text-charcoal">Set a new password</h1>
      <p className="mt-2 text-sm text-ink-muted">Choose a strong password for your SupportFlow account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        {apiError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {apiError}
          </div>
        )}
        {done && (
          <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800">
            Password updated. Redirecting to login...
          </div>
        )}
        <div>
          <Label htmlFor="newPassword">New password</Label>
          <Input id="newPassword" type="password" autoComplete="new-password" {...register("newPassword")} />
          {errors.newPassword && (
            <p className="mt-1.5 text-sm text-red-600">{errors.newPassword.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="mt-1.5 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting || done}>
          {isSubmitting ? "Saving..." : "Update password"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-muted">
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Back to login
        </Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<div className="text-sm text-ink-muted">Loading...</div>}>
      <ResetPasswordFormInner />
    </Suspense>
  );
}
