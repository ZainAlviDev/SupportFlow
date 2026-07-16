"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPassword } from "@supportflow/api-client";
import { SupportFlowLogo } from "@/components/brand/SupportFlowLogo";
import { api } from "@/lib/api";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validations/auth";
import { Button, Input, Label } from "@supportflow/ui";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      channel: "email",
      email: "",
    },
  });

  const channel = watch("channel");

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setApiError(null);

    try {
      const result = await forgotPassword(api, {
        channel: values.channel,
        email: values.email,
      });

      const params = new URLSearchParams({
        channel: values.channel,
        email: values.email ?? "",
      });
      if (result.devOtp) {
        params.set("devOtp", result.devOtp);
      }

      router.push(`/forgot-password/verify?${params.toString()}`);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unable to send recovery code.");
    }
  };

  return (
    <div>
      <SupportFlowLogo className="mb-10" />
      <h1 className="text-3xl font-bold tracking-tight text-charcoal">Recover access</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Enter the email you registered with, then choose Email or WhatsApp. We send the code to
        your saved contact details — not a new number.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        {apiError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {apiError}
          </div>
        )}

        <div>
          <Label htmlFor="email">Registered email</Label>
          <Input id="email" type="email" placeholder="name@company.com" {...register("email")} />
          {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Send code via</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setValue("channel", "email")}
              className={`rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                channel === "email"
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-line text-ink-soft"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setValue("channel", "whatsapp")}
              className={`rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                channel === "whatsapp"
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-line text-ink-soft"
              }`}
            >
              WhatsApp
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            WhatsApp uses the number you added when creating your account.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending code..." : "Send recovery code"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Back to login
        </Link>
      </p>
    </div>
  );
}
