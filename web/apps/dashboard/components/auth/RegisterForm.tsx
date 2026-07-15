"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SupportFlowLogo } from "@/components/brand/SupportFlowLogo";
import { useAuth } from "@/hooks/useAuth";
import { clearSessionCookies } from "@/lib/api";
import { registerSchema, toE164, type RegisterFormValues } from "@/lib/validations/auth";
import { COUNTRY_DIAL_CODES } from "@/lib/countryDialCodes";
import { Button, Input, Label, PasswordInput } from "@supportflow/ui";

type Step = 1 | 2;

export function RegisterForm() {
  const { register: registerAccount, isLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneCountryCode: "+92",
      phoneNationalNumber: "",
      workspaceName: "",
      password: "",
    },
    mode: "onBlur",
  });

  const goToWorkspaceStep = async () => {
    setApiError(null);
    const valid = await trigger(["fullName", "email", "password", "phoneCountryCode", "phoneNationalNumber"]);
    if (valid) {
      setStep(2);
    }
  };

  const onSubmit = async (values: RegisterFormValues) => {
    setApiError(null);

    try {
      const response = await registerAccount({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        workspaceName: values.workspaceName,
        phoneNumber: toE164(values.phoneCountryCode, values.phoneNationalNumber),
      });

      sessionStorage.setItem("sf_pending_workspace_name", values.workspaceName.trim());

      // Ensure no leftover session cookies bounce the user to the dashboard.
      localStorage.removeItem("sf_access_token");
      localStorage.removeItem("sf_refresh_token");
      localStorage.removeItem("sf_user");
      localStorage.removeItem("sf_workspace");
      clearSessionCookies();

      const params = new URLSearchParams({ email: response.email });
      if (response.devOtp) {
        params.set("devOtp", response.devOtp);
      }
      router.push(`/verify-email?${params.toString()}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create workspace. Please try again.";
      setApiError(message);
    }
  };

  const submitting = isLoading || isSubmitting;

  return (
    <div>
      <SupportFlowLogo className="mb-10" />

      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-600">
          Step {step} of 2
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-charcoal">
          {step === 1 ? "Create your account" : "Set up your workspace"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {step === 1
            ? "Enter your details to get started with SupportFlow."
            : "Name the workspace your team will use for customer support."}
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-brand-500" : "bg-line"}`} />
        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-brand-500" : "bg-line"}`} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {apiError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {apiError}
          </div>
        )}

        {step === 1 && (
          <>
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                autoComplete="name"
                placeholder="Jane Cooper"
                aria-invalid={Boolean(errors.fullName)}
                className={
                  errors.fullName ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                }
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="mt-1.5 text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                aria-invalid={Boolean(errors.email)}
                className={
                  errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                }
                {...register("email")}
              />
              {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="phoneNationalNumber">WhatsApp number</Label>
              <div className="mt-1.5 flex gap-2">
                <select
                  id="phoneCountryCode"
                  className="h-11 rounded-lg border border-line bg-white px-2 text-sm text-ink"
                  {...register("phoneCountryCode")}
                >
                  {COUNTRY_DIAL_CODES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code}
                    </option>
                  ))}
                </select>
                <Input
                  id="phoneNationalNumber"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="3001234567"
                  aria-invalid={Boolean(errors.phoneNationalNumber)}
                  className={
                    errors.phoneNationalNumber
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : ""
                  }
                  {...register("phoneNationalNumber")}
                />
              </div>
              {(errors.phoneCountryCode || errors.phoneNationalNumber) && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.phoneNationalNumber?.message ?? errors.phoneCountryCode?.message}
                </p>
              )}
              <p className="mt-1.5 text-xs text-ink-faint">
                Saved on your account for WhatsApp password recovery.
              </p>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                placeholder="Create a strong password"
                aria-invalid={Boolean(errors.password)}
                className={
                  errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                }
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button type="button" className="w-full" onClick={goToWorkspaceStep}>
              Continue
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="rounded-lg border border-line bg-surface-soft px-3 py-2 text-sm text-ink-muted">
              Creating workspace for <span className="font-semibold text-ink">{getValues("email")}</span>
            </div>

            <div>
              <Label htmlFor="workspaceName">Workspace name</Label>
              <Input
                id="workspaceName"
                placeholder="Acme Support"
                aria-invalid={Boolean(errors.workspaceName)}
                className={
                  errors.workspaceName
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : ""
                }
                {...register("workspaceName")}
              />
              {errors.workspaceName && (
                <p className="mt-1.5 text-sm text-red-600">{errors.workspaceName.message}</p>
              )}
              <p className="mt-1.5 text-xs text-ink-faint">
                This is the company or team name your agents will see.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep(1)}
                disabled={submitting}
              >
                Back
              </Button>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating account..." : "Create account"}
              </Button>
            </div>
          </>
        )}
      </form>

      <p className="mt-8 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
