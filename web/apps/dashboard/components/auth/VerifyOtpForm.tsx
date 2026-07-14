"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyResetOtp } from "@supportflow/api-client";
import { SupportFlowLogo } from "@/components/brand/SupportFlowLogo";
import { api } from "@/lib/api";
import { verifyOtpSchema, type VerifyOtpFormValues } from "@/lib/validations/auth";
import { Button, Input, Label } from "@supportflow/ui";

function VerifyOtpFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const channel = (searchParams.get("channel") === "whatsapp" ? "whatsapp" : "email") as
    | "email"
    | "whatsapp";
  const email = searchParams.get("email") ?? undefined;
  const hintOtp = searchParams.get("devOtp");

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
    try {
      const result = await verifyResetOtp(api, {
        channel,
        code: values.code,
        email,
      });

      const params = new URLSearchParams({ token: result.resetToken });
      router.push(`/forgot-password/reset?${params.toString()}`);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Invalid or expired code.");
    }
  };

  return (
    <div>
      <SupportFlowLogo className="mb-10" />
      <h1 className="text-3xl font-bold tracking-tight text-charcoal">Enter recovery code</h1>
      <p className="mt-2 text-sm text-ink-muted">
        We sent a 6-digit code via {channel === "email" ? "your registered email" : "your registered WhatsApp number"}.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        {apiError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
          <Input id="code" inputMode="numeric" placeholder="123456" maxLength={6} {...register("code")} />
          {errors.code && <p className="mt-1.5 text-sm text-red-600">{errors.code.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Verify code"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-muted">
        <Link href="/forgot-password" className="font-semibold text-brand-600 hover:text-brand-700">
          Resend code
        </Link>
      </p>
    </div>
  );
}

export function VerifyOtpForm() {
  return (
    <Suspense fallback={<div className="text-sm text-ink-muted">Loading...</div>}>
      <VerifyOtpFormInner />
    </Suspense>
  );
}
