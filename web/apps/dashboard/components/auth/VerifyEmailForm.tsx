"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SupportFlowLogo } from "@/components/brand/SupportFlowLogo";
import { useAuth } from "@/hooks/useAuth";
import { verifyOtpSchema, type VerifyOtpFormValues } from "@/lib/validations/auth";
import { Button, Input, Label } from "@supportflow/ui";

function VerifyEmailFormInner() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const hintOtp = searchParams.get("devOtp");
  const { verifyEmail, isLoading } = useAuth();

  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { code: "" },
  });

  const onSubmit = async (values: VerifyOtpFormValues) => {
    setApiError(null);

    if (!email) {
      setApiError("Missing email. Start again from registration.");
      return;
    }

    try {
      const workspaceName =
        typeof window !== "undefined"
          ? sessionStorage.getItem("sf_pending_workspace_name") ?? undefined
          : undefined;

      await verifyEmail(email, values.code, workspaceName);
      sessionStorage.removeItem("sf_pending_workspace_name");
      window.location.assign(`/login?verified=1&email=${encodeURIComponent(email)}`);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Invalid or expired code.");
    }
  };

  const submitting = isLoading || isSubmitting;

  return (
    <div>
      <SupportFlowLogo className="mb-10" />
      <h1 className="text-3xl font-bold tracking-tight text-charcoal">Verify your email</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Registration is not complete until you confirm your email. Enter the 6-digit code we sent to{" "}
        <span className="font-semibold text-ink">{email || "your inbox"}</span> (valid for 2 minutes),
        then you can sign in.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        {apiError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {apiError}
          </div>
        )}
        {hintOtp && (
          <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800">
            Dev OTP: <strong>{hintOtp}</strong> (also logged in Identity console)
          </p>
        )}
        <div>
          <Label htmlFor="code">6-digit code</Label>
          <Input
            id="code"
            inputMode="numeric"
            placeholder="123456"
            maxLength={6}
            autoComplete="one-time-code"
            {...register("code")}
          />
          {errors.code && <p className="mt-1.5 text-sm text-red-600">{errors.code.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Verifying..." : "Verify email"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-muted">
        Wrong email?{" "}
        <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Register again
        </Link>
      </p>
    </div>
  );
}

export function VerifyEmailForm() {
  return (
    <Suspense fallback={<div className="text-sm text-ink-muted">Loading...</div>}>
      <VerifyEmailFormInner />
    </Suspense>
  );
}
