"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { previewInvite, type InvitePreviewResponse } from "@supportflow/api-client";
import { SupportFlowLogo } from "@/components/brand/SupportFlowLogo";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { COUNTRY_DIAL_CODES } from "@/lib/countryDialCodes";
import { toE164 } from "@/lib/validations/auth";
import { Button, Input, Label, PasswordInput } from "@supportflow/ui";

function AcceptInviteFormInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { acceptInvite, isLoading, user } = useAuth();

  const [preview, setPreview] = useState<InvitePreviewResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+92");
  const [phoneNationalNumber, setPhoneNationalNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    if (!token) {
      setLoadError("This invitation link is missing a token.");
      return;
    }

    (async () => {
      try {
        const result = await previewInvite(api, token);
        if (active) setPreview(result);
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "This invitation is invalid.");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [token]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !preview) return;

    setApiError(null);
    setSubmitting(true);

    try {
      const sameUserLoggedIn =
        Boolean(user) && user?.email.toLowerCase() === preview.email.toLowerCase();

      if (sameUserLoggedIn) {
        await acceptInvite({ token });
      } else if (preview.accountExists) {
        await acceptInvite({ token, password });
      } else {
        await acceptInvite({
          token,
          password,
          fullName: fullName.trim(),
          phoneNumber: toE164(phoneCountryCode, phoneNationalNumber),
        });
      }

      window.location.assign("/inbox");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unable to accept invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  const busy = isLoading || submitting;

  if (loadError) {
    return (
      <div>
        <SupportFlowLogo className="mb-10" />
        <h1 className="text-3xl font-bold tracking-tight text-charcoal">Invitation unavailable</h1>
        <p className="mt-2 text-sm text-ink-muted">{loadError}</p>
        <p className="mt-8 text-sm text-ink-muted">
          <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Back to login
          </Link>
        </p>
      </div>
    );
  }

  if (!preview) {
    return <div className="text-sm text-ink-muted">Loading invitation...</div>;
  }

  const loggedInAsInvitee =
    Boolean(user) && user?.email.toLowerCase() === preview.email.toLowerCase();

  return (
    <div>
      <SupportFlowLogo className="mb-10" />
      <h1 className="text-3xl font-bold tracking-tight text-charcoal">Accept invitation</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Join <span className="font-semibold text-ink">{preview.workspaceName}</span> as{" "}
        <span className="font-semibold text-ink">{preview.role}</span>.
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        Invited email: <span className="font-semibold text-ink">{preview.email}</span>
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        {apiError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {apiError}
          </div>
        )}

        {!loggedInAsInvitee && preview.accountExists && (
          <div>
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="mt-1.5 text-xs text-ink-faint">
              Sign in with your existing SupportFlow password to join.
            </p>
          </div>
        )}

        {!loggedInAsInvitee && !preview.accountExists && (
          <>
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phoneNationalNumber">WhatsApp number</Label>
              <div className="mt-1.5 flex gap-2">
                <select
                  className="h-11 rounded-lg border border-line bg-white px-2 text-sm text-ink"
                  value={phoneCountryCode}
                  onChange={(e) => setPhoneCountryCode(e.target.value)}
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
                  value={phoneNationalNumber}
                  onChange={(e) => setPhoneNationalNumber(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Create password</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </>
        )}

        {loggedInAsInvitee && (
          <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800">
            You are signed in as {preview.email}. Click below to join this workspace.
          </p>
        )}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Joining..." : preview.accountExists || loggedInAsInvitee ? "Join workspace" : "Create account & join"}
        </Button>
      </form>
    </div>
  );
}

export function AcceptInviteForm() {
  return (
    <Suspense fallback={<div className="text-sm text-ink-muted">Loading...</div>}>
      <AcceptInviteFormInner />
    </Suspense>
  );
}
