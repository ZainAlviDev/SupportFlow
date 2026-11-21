# SupportFlow — Forgot Password & WhatsApp OTP (Future Lane)

**Status:** Implemented (Phase 1 auth recovery lane)  
**Owner:** TechHub · SupportFlow  
**Last updated:** July 2026

Phone on registration + forgot-password (email / WhatsApp OTP) is wired in Identity and the dashboard. WhatsApp defaults to **Console** logging in Development; set `WhatsApp:Enabled=true` and `Provider=Meta` with credentials for Meta Cloud API R&D.

---

## 1. Goal

- Forgot-password UI with **two channels**: **Email** or **WhatsApp**
- Send a **6-digit OTP** → verify → set new password → login
- Add **phone number + country code** on registration (E.164), validated client and server
- WhatsApp delivery via **Meta WhatsApp Cloud API** (free for R&D test WABA)

---

## 2. WhatsApp / Meta Cloud API — R&D findings

**Yes — Meta WhatsApp Cloud API can be used free for development/R&D.**

When you create a Meta app and add the WhatsApp product, Meta provisions:

- A free **test WhatsApp Business Account (WABA)**
- A free **test business phone number**
- **No payment method required** to send template messages from that test number
- Recipients must be on an **allowlist** (verify each test phone in Meta API Setup)
- Temporary access tokens (~24h); prefer a **System User** token in secrets for R&D

| Mode | Sender | Who can receive | Cost |
|------|--------|-----------------|------|
| R&D / Development | Meta **test** phone number | Only **allowlisted** test recipients | Free |
| Local without Meta creds | Console logger | N/A (OTP in Identity logs) | Free |
| **Local email (Dev)** | **MailHog SMTP** (`localhost:1025`) | Any address — open http://localhost:8025 | Free |
| Production | Verified business number + Authentication template | Real users | Auth OTPs **billed per message** by country |

**OTP template:** Smoke test can use Meta’s `hello_world`. Password-reset OTPs need an **Authentication** template in WhatsApp Manager. Until approved, fall back to Console for OTP delivery.

**Do not use** unofficial WhatsApp web scrapers — against ToS and unreliable.

---

## 3. Product flow

1. User opens **Forgot password** (from Login “Forgot password?” link)
2. Chooses **Email** or **WhatsApp**, enters email or phone (country + number)
3. Backend creates hashed OTP challenge, sends via chosen channel
4. User enters OTP → receives short-lived `resetToken`
5. User sets new password → challenge consumed → redirect to login

```
ForgotPassword UI → Identity Auth API → PasswordResetChallenge store
                         ├→ IEmailOtpSender (Console → SMTP later)
                         └→ IWhatsAppOtpSender (Meta Cloud API | Console fallback)
```

---

## 4. Registration changes (with this lane)

Extend register payload with phone:

- `phoneCountryCode` (e.g. `+92`) + `phoneNationalNumber`, or single E.164 `phoneNumber`
- Persist on Identity `User.PhoneNumber` (E.164)
- Unique index on normalized phone for WhatsApp lookup
- Frontend: country dial-code picker + `libphonenumber-js`
- Backend: `libphonenumber-csharp` / `PhoneNumbers` validation

Register step 1 fields: fullName, email, password, **phone (country + number)**.

---

## 5. API design (Identity, via Gateway `/api/v1/auth/*`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/forgot-password` | `{ channel: "email" \| "whatsapp", email? \| phoneE164? }` — always generic success (no user enumeration) |
| POST | `/auth/verify-reset-otp` | Verify code → `{ resetToken }` |
| POST | `/auth/reset-password` | `{ resetToken, newPassword }` |

**Entity `PasswordResetChallenge`:** UserId, Channel, CodeHash, ExpiresAt, Attempts, ConsumedAt, CreatedAt.

**OTP defaults:** length 6, expiry 10 minutes, max attempts 5, resend cooldown ~60s.

---

## 6. WhatsApp sender (R&D-first)

- `MetaWhatsAppOtpSender` — `POST https://graph.facebook.com/{ApiVersion}/{PhoneNumberId}/messages` with Bearer token + authentication template
- `ConsoleWhatsAppOtpSender` — fallback when disabled or credentials missing
- Select via configuration, not compile-time switches

**Suggested Development config:**

```json
"Otp": { "Length": 6, "ExpiryMinutes": 10, "MaxAttempts": 5 },
"Email": { "Provider": "Console" },
"WhatsApp": {
  "Enabled": true,
  "Provider": "Meta",
  "ApiVersion": "v21.0",
  "PhoneNumberId": "<from Meta API Setup>",
  "AccessToken": "<system user or temp token — use user-secrets>",
  "TemplateName": "password_reset_otp",
  "TemplateLanguage": "en_US"
}
```

Store secrets in user-secrets / env (`WhatsApp__AccessToken`), never commit tokens.

---

## 7. Frontend (dashboard)

| Route | Purpose |
|-------|---------|
| `/forgot-password` | Channel + identifier |
| `/forgot-password/verify` | Enter OTP |
| `/forgot-password/reset` | New password |
| Register step 1 | Add phone + country code UI |

Match existing auth layout (charcoal + mint). Extend `@supportflow/api-client` types and routes.

---

## 8. Meta R&D setup checklist (manual, once)

1. [Meta for Developers](https://developers.facebook.com/) → create app → add **WhatsApp**
2. Copy **Phone number ID**, **WABA ID**, access token
3. API Setup → add your phone as test recipient and verify
4. Create/submit **Authentication** template for OTP (or use Console until approved)
5. Put IDs/token in Identity user-secrets / Development config
6. Run forgot-password with WhatsApp channel → OTP on allowlisted phone

---

## 9. Implementation checklist (when scheduled)

- [ ] Phone fields on register (contracts, validator, RegisterService, RegisterForm)
- [ ] `PasswordResetChallenge` entity + EF migration
- [ ] Forgot / verify OTP / reset-password commands + AuthController endpoints
- [ ] `IEmailOtpSender` + Console implementation
- [ ] `IWhatsAppOtpSender` + Meta + Console implementations
- [ ] Forgot-password UI pages + LoginForm link
- [ ] api-client methods
- [ ] Meta test WABA configured; auth template approved or Console fallback verified
- [ ] Production: billing-aware WhatsApp; real business number; permanent token

---

## 10. Explicitly out of scope for this lane

- Full Meta Business verification / production number porting (separate ops task)
- SMS as a third recovery channel
- Phone-OTP **login** (this lane is **password recovery only**)
- Replacing Phase 1 email confirmation / invites

---

## 11. Related docs

- Phase 1 plan: `docs/DEVELOPER_PLAN_PHASE1.md` (lists password reset as deferred)
- Technical roadmap auth section: `docs/TECHNICAL_ROADMAP_PHASE1.md`
