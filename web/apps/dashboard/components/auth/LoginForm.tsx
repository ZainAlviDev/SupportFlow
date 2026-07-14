"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SupportFlowLogo } from "@/components/brand/SupportFlowLogo";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { Button, Input, Label } from "@supportflow/ui";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H12Z"
      />
      <path
        fill="#34A853"
        d="M6.6 14.3 5.9 14.8l-2.1 1.6C5.3 19.5 8.4 21.5 12 21.5c2.1 0 3.9-.7 5.2-1.9l-3.1-2.4c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8Z"
      />
      <path
        fill="#4A90E2"
        d="M3.8 7.6A9.4 9.4 0 0 0 2.5 12c0 1.6.4 3.1 1.1 4.4l3-2.3c-.3-.8-.4-1.5-.4-2.1 0-.7.1-1.4.4-2.1L3.8 7.6Z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.1c1.2 0 2.2.4 3.1 1.2l2.3-2.3C15.9 2.7 14.1 2 12 2 8.4 2 5.3 4 3.8 7.6l3 2.3C7.6 6.7 9.6 5.1 12 5.1Z"
      />
    </svg>
  );
}

function LoginFormInner() {
  const { login, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";
  const justRegistered = searchParams.get("registered") === "1";
  const justVerified = searchParams.get("verified") === "1";
  const hintOtp = searchParams.get("devOtp");
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: emailFromQuery,
      password: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (values: LoginFormValues) => {
    setApiError(null);

    try {
      await login(values.email, values.password);
      // Hard navigation so the sf_session cookie is present for middleware on /inbox.
      window.location.assign("/inbox");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign in. Please try again.";
      setApiError(message);
    }
  };

  const submitting = isLoading || isSubmitting;

  const verifyHref = (() => {
    const params = new URLSearchParams();
    if (emailFromQuery) params.set("email", emailFromQuery);
    if (hintOtp) params.set("devOtp", hintOtp);
    const qs = params.toString();
    return qs ? `/verify-email?${qs}` : "/verify-email";
  })();

  return (
    <div>
      <SupportFlowLogo className="mb-10" />

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-charcoal">Welcome back</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Sign in to your workspace to pick up where you left off.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {justRegistered && (
          <div
            role="status"
            className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800"
          >
            Account created.{" "}
            <Link href={verifyHref} className="font-semibold underline">
              Verify your email
            </Link>{" "}
            with the code we sent, then sign in.
            {hintOtp ? (
              <>
                {" "}
                Dev OTP: <strong>{hintOtp}</strong>
              </>
            ) : null}
          </div>
        )}

        {justVerified && (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          >
            Email verified. Sign in to open your workspace.
          </div>
        )}

        {apiError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {apiError}
            {apiError.toLowerCase().includes("verify") && (
              <>
                {" "}
                <Link href={verifyHref} className="font-semibold underline">
                  Enter verification code
                </Link>
              </>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="mt-1.5 text-sm text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={
              errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
            }
            {...register("password")}
          />
          {errors.password && (
            <p id="password-error" className="mt-1.5 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
          <div className="mt-2 flex justify-end">
            <Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">or</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <Button type="button" variant="outline" className="w-full font-medium" disabled>
        <GoogleIcon />
        Continue with Google
      </Button>

      <p className="mt-8 text-center text-sm text-ink-muted">
        New to SupportFlow?{" "}
        <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Create a workspace
        </Link>
      </p>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div className="text-sm text-ink-muted">Loading...</div>}>
      <LoginFormInner />
    </Suspense>
  );
}
