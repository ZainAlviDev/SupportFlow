# SupportFlow — Phase 2 Developer Plan

**Organization:** TechHub  
**Product:** SupportFlow — AI Customer Support SaaS Platform  
**Phase:** 2 (Growth & Multi-Channel)  
**Version:** 1.1  
**Date:** July 20, 2026  
**Project Location:** `C:\Projects\SupportFlow`  
**Target Delivery:** 10 weeks (part-time schedule)  
**Prerequisite:** Phase 1 MVP complete and UAT signed off

---

## 1. Overview

This document defines the Phase 2 development plan, task allocation, milestones, and delivery criteria for SupportFlow. It is intended for internal use by the development team and project stakeholders.

Phase 2 builds on the Phase 1 MVP by adding multi-channel support, file attachments, productivity features, a public help center, basic analytics, automated testing, and staging deployment readiness.

**Team:** Two full-stack developers and one frontend developer. Zain Alvi and Mariyam Ali own full-stack delivery on assigned modules (API + main UI). Khadija Asif supports with **limited** frontend polish only — not full feature UI ownership.

---

## 2. Team & Working Model

| Name | Role | Hours / Week | Responsibility |
|------|------|--------------|----------------|
| **Zain Alvi** | Full-Stack Developer | **14 hours** | Backend + main frontend on assigned modules; lead full-stack delivery |
| **Mariyam Ali** | Full-Stack Developer | **7 hours** | Backend + main frontend on assigned modules |
| **Khadija Asif** | Frontend Developer | **7 hours** | Light frontend support only — badges, empty states, responsive polish |

Zain’s hours are higher because he owns full-stack delivery on more modules (including most feature UI). Mariyam owns full-stack on her modules. **Khadija does not build complete feature pages** — she assists with small UI polish tasks only.

### 2.1 Version Control

| Branch | Purpose |
|--------|---------|
| `master` | Production-ready code |
| `DEV` | Integration branch |
| `ZainDev` | Zain's feature work |
| `MariyamDev` | Mariyam's feature work |
| `KhadijaDev` | Khadija's feature work |

All changes merge into `DEV` via pull request with peer review before integration.

### 2.2 Weekly Schedule by Developer

| Developer | Weekday | Weekend | Total |
|-----------|---------|---------|-------|
| **Zain Alvi** | 1.5 hours/day × 5 (Mon–Fri) | 6.5 hours | **14 hours/week** |
| **Mariyam Ali** | 1 hour/day × 5 (Mon–Fri) | 2 hours | **7 hours/week** |
| **Khadija Asif** | 1 hour/day × 5 (Mon–Fri) | 2 hours | **7 hours/week** |

| Period | Activity |
|--------|----------|
| Monday–Friday | Stand-up, planning, development |
| Weekend (Sat or Sun) | Deep work, integration, module demo |

### 2.3 Module Ownership

| Module | Full-stack owner (API + main UI) | Khadija (light UI only) |
|--------|----------------------------------|-------------------------|
| 8 — Attachments | **Zain Alvi** | Responsive polish |
| 9 — Email channel | **Mariyam Ali** | Channel badge polish |
| 10 — WhatsApp channel | **Zain Alvi** | Status indicator polish |
| 11 — Email notifications | **Mariyam Ali** | — |
| 12 — Command palette | **Zain Alvi** | Mobile shortcut button |
| 13 — Help center | **Mariyam Ali** | Typography / SEO polish |
| 14 — Analytics | **Zain Alvi** | Chart loading skeletons |
| 15 — E2E & regression | **Zain Alvi** + **Mariyam Ali** | 1–2 simple Playwright flows |
| 16 — Staging deployment | **Zain Alvi** + **Mariyam Ali** | Staging UI smoke check |

---

## 3. Phase 2 Goals

After Phase 2, a business can:

1. Send and receive **file attachments** in widget and inbox conversations
2. Connect an **email inbox** so customer emails create/update conversations
3. Connect **WhatsApp** (Meta Cloud API) as a customer channel
4. Receive **email notifications** for assignments and missed messages (in addition to in-app)
5. Use a **command palette** (Cmd+K) for fast navigation and actions
6. Publish a **public help center** from knowledge base articles
7. View **basic analytics** (volume, response time, channel mix)
8. Run **Playwright E2E** tests on critical flows in CI
9. Deploy to a **staging environment** on Azure with documented runbook

---

## 4. Phase 2 Scope Summary

### 4.1 In Scope

| # | Module | Weeks | Full-stack owner | Khadija (light UI) |
|---|--------|-------|------------------|--------------------|
| 8 | File attachments & blob storage | 1–2 | **Zain Alvi** | Responsive polish |
| 9 | Email channel (inbound + outbound) | 2–4 | **Mariyam Ali** | Channel badge |
| 10 | WhatsApp channel (Meta Cloud API) | 4–6 | **Zain Alvi** | Status polish |
| 11 | Email notifications & digests | 6 | **Mariyam Ali** | — |
| 12 | Command palette & productivity UX | 7 | **Zain Alvi** | Mobile shortcut |
| 13 | Public help center | 7–8 | **Mariyam Ali** | SEO / typography polish |
| 14 | Analytics & reporting | 8–9 | **Zain Alvi** | Loading skeletons |
| 15 | Playwright E2E & regression | 9 | Zain + Mariyam | 1–2 simple flows |
| 16 | Staging deployment & release prep | 10 | Zain + Mariyam | Staging smoke check |

### 4.2 Out of Scope (Phase 3+)

- Stripe billing and subscription plans
- SSO (SAML / OIDC)
- Workflow automations and rule engine
- Elasticsearch / advanced search
- SMS channel
- Mobile apps
- AI auto-reply (unsupervised send)
- Multi-language / i18n

### 4.3 Carried Forward from Phase 1 (now in Phase 2)

| Phase 1 deferred item | Phase 2 module |
|----------------------|----------------|
| File attachments in chat | Module 8 |
| Email notifications | Module 11 |
| Command palette (Cmd+K) | Module 12 |
| Playwright E2E | Module 15 |
| Azure production deployment | Module 16 (staging first) |
| Email channel | Module 9 |
| WhatsApp as support channel | Module 10 |

---

## 5. Module 8 — File Attachments & Blob Storage

**Timeline:** Weeks 1–2  
**Objective:** Agents and customers can attach images and PDFs to messages; files are stored securely per tenant.  
**Full-stack owner:** Zain Alvi

### 5.1 Full-stack (Zain Alvi)

| Task | Owner |
|------|-------|
| `MessageAttachment` entity and EF migration (Conversation service) | Zain Alvi |
| Azure Blob Storage abstraction + MinIO local dev in `docker-compose` | Zain Alvi |
| `POST /conversations/{id}/messages/attachments` upload endpoint (multipart) | Zain Alvi |
| `ProcessAttachmentJob` (Hangfire): MIME validation, size limit, image metadata | Zain Alvi |
| Signed URL or gateway proxy for secure download | Zain Alvi |
| API client: `uploadAttachment` types in `@supportflow/api-client` | Zain Alvi |
| Inbox composer: attachment button, upload, progress, and MessageBubble preview | Zain Alvi |
| Widget attachment upload UI | Zain Alvi |
| Tenant isolation tests + Gateway route + Swagger | Zain Alvi |

### 5.2 Light UI (Khadija Asif)

| Task | Owner |
|------|-------|
| Responsive polish for attachment chips on mobile | Khadija Asif |

### 5.3 Support (Mariyam Ali)

| Task | Owner |
|------|-------|
| Widget SignalR payload update for attachment metadata | Mariyam Ali |

**Acceptance Criteria**

- Agent uploads a PNG in inbox; customer sees it in widget within 2 seconds
- Customer uploads a PDF in widget; agent sees filename and can download
- Tenant A cannot access Tenant B attachment URL (404)
- Max file size 10 MB; rejected types return validation error

**Demo:** End of Week 2

---

## 6. Module 9 — Email Channel

**Timeline:** Weeks 2–4  
**Objective:** Workspace connects a support email address; inbound emails create or continue conversations; agent replies send email to the customer.  
**Full-stack owner:** Mariyam Ali

### 6.1 Full-stack (Mariyam Ali)

| Task | Owner |
|------|-------|
| `ChannelType.Email` enum extension + conversation `channel` metadata | Mariyam Ali |
| `EmailChannelConfig` entity (tenant, inbound address, provider settings JSON) | Mariyam Ali |
| Inbound webhook: SendGrid Inbound Parse or MailHog dev adapter | Mariyam Ali |
| Parse email → customer match/create → conversation → message | Mariyam Ali |
| Outbound: `IEmailSender` reply with threading headers (`In-Reply-To`, `References`) | Mariyam Ali |
| Attachment pass-through from email to `MessageAttachment` | Mariyam Ali |
| `POST/GET/PATCH /settings/channels/email` CRUD API (Workspace service) | Mariyam Ali |
| Background job: retry failed outbound email | Mariyam Ali |
| Settings → Channels → Email page (connect, verify, disconnect, empty states) | Mariyam Ali |
| Email composer hint + setup wizard stepper | Mariyam Ali |
| Swagger + integration tests | Mariyam Ali |

### 6.2 Light UI (Khadija Asif)

| Task | Owner |
|------|-------|
| Inbox channel badge (email icon) polish on conversation list | Khadija Asif |

### 6.3 Support (Zain Alvi)

| Task | Owner |
|------|-------|
| Gateway routes for email webhook (public, signed) | Zain Alvi |
| Notification hook: new email conversation → in-app notification | Zain Alvi |

**Acceptance Criteria**

- Email sent to workspace support address appears as new conversation in inbox
- Agent reply from inbox delivers email to customer mailbox (MailHog in dev)
- Reply threading keeps messages in the same conversation
- Email channel can be enabled/disabled in settings

**Demo:** End of Week 4

---

## 7. Module 10 — WhatsApp Channel

**Timeline:** Weeks 4–6  
**Objective:** Connect WhatsApp Business (Meta Cloud API); customer WhatsApp messages appear in inbox; agents reply from inbox.  
**Full-stack owner:** Zain Alvi

### 7.1 Full-stack (Zain Alvi)

| Task | Owner |
|------|-------|
| `ChannelType.WhatsApp` + `WhatsAppChannelConfig` entity | Zain Alvi |
| Meta webhook verification + inbound message handler | Zain Alvi |
| Map WhatsApp user phone → `Customer` (E.164) | Zain Alvi |
| Outbound: `IWhatsAppMessageSender` (text + optional template) | Zain Alvi |
| Reuse Meta Cloud API patterns from Identity forgot-password lane | Zain Alvi |
| `POST/GET/PATCH /settings/channels/whatsapp` API | Zain Alvi |
| 24-hour session window handling (template fallback stub) | Zain Alvi |
| Dev: Console sender fallback when Meta credentials missing | Zain Alvi |
| Settings → Channels → WhatsApp page + template picker + connection status | Zain Alvi |
| WhatsApp channel badge in inbox list and thread header | Zain Alvi |
| Integration tests with mocked Meta API | Zain Alvi |

### 7.2 Light UI (Khadija Asif)

| Task | Owner |
|------|-------|
| Connection status indicator polish (connected / pending / error styles) | Khadija Asif |

### 7.3 Support (Mariyam Ali)

| Task | Owner |
|------|-------|
| API client types for WhatsApp settings | Mariyam Ali |
| Customer profile: show WhatsApp number field | Mariyam Ali |

**Reference:** `docs/FORGOT_PASSWORD_WHATSAPP_OTP.md` for Meta Cloud API setup.

**Acceptance Criteria**

- Test WhatsApp message creates conversation in inbox
- Agent reply is delivered to WhatsApp (Meta test number in dev)
- WhatsApp settings page shows connection status
- Console fallback logs outbound messages when Meta is disabled

**Demo:** End of Week 6

---

## 8. Module 11 — Email Notifications & Digests

**Timeline:** Week 6  
**Objective:** Agents receive email alerts for key events; notification preferences are configurable.  
**Full-stack owner:** Mariyam Ali

### 8.1 Full-stack (Mariyam Ali)

| Task | Owner |
|------|-------|
| `SendEmailNotificationJob` (Hangfire) wired to Notification events | Mariyam Ali |
| Notification preferences entity (per user: email on/off per type) | Mariyam Ali |
| `GET/PATCH /notifications/preferences` API | Mariyam Ali |
| Email templates: assignment, new message (when offline), daily digest stub | Mariyam Ali |
| Respect user preferences before send | Mariyam Ali |
| Settings → Notifications page (toggles, save, toasts) | Mariyam Ali |
| Link from notification bell dropdown to preferences | Mariyam Ali |

### 8.2 Support (Zain Alvi)

| Task | Owner |
|------|-------|
| Trigger email job from Conversation/Ticket assignment events | Zain Alvi |

**Note:** No Khadija tasks on this module.

**Acceptance Criteria**

- Assign conversation → assignee receives email (MailHog) when preference enabled
- Disable "new message" email → no email on new customer message
- In-app notifications still work independently of email

**Demo:** End of Week 6

---

## 9. Module 12 — Command Palette & Productivity UX

**Timeline:** Week 7  
**Objective:** Cmd+K (Ctrl+K) opens a command palette for navigation, search, and quick actions.  
**Full-stack owner:** Zain Alvi

### 9.1 Full-stack (Zain Alvi)

| Task | Owner |
|------|-------|
| `GET /search?q=` unified search API (conversations, tickets, customers) | Zain Alvi |
| Tenant-scoped search with pagination | Zain Alvi |
| API client `searchWorkspace` | Zain Alvi |
| `CommandPalette` component (sections, actions, fuzzy filter, dark mode) | Zain Alvi |
| Global keyboard shortcut Cmd+K / Ctrl+K | Zain Alvi |
| Swagger + integration tests | Zain Alvi |

### 9.2 Light UI (Khadija Asif)

| Task | Owner |
|------|-------|
| Mobile header shortcut button to open palette | Khadija Asif |

### 9.3 Support (Mariyam Ali)

| Task | Owner |
|------|-------|
| Peer review of search API contract | Mariyam Ali |

**Acceptance Criteria**

- Cmd+K opens palette from any dashboard page
- Typing searches customers and tickets with live results
- Selecting a result navigates to the correct detail page
- Escape closes palette

**Demo:** End of Week 7

---

## 10. Module 13 — Public Help Center

**Timeline:** Weeks 7–8  
**Objective:** Published knowledge articles are available on a public, branded help center URL per workspace.  
**Full-stack owner:** Mariyam Ali

### 10.1 Full-stack (Mariyam Ali)

| Task | Owner |
|------|-------|
| `HelpCenterSettings` (slug, enabled, branding overrides) in Workspace service | Mariyam Ali |
| Public routes: `GET /public/{slug}/articles`, `GET /public/{slug}/articles/{id}` | Mariyam Ali |
| Only `Published` articles exposed; HTML sanitization on render | Mariyam Ali |
| Optional: public article search (SQL `LIKE` / full-text) | Mariyam Ali |
| Cache headers for public pages | Mariyam Ali |
| Help center app/routes: home, article detail, branding | Mariyam Ali |
| Settings → Help Center (slug, enable, copy public URL) | Mariyam Ali |

### 10.2 Light UI (Khadija Asif)

| Task | Owner |
|------|-------|
| Typography and SEO meta tag polish on article pages | Khadija Asif |

### 10.3 Support (Zain Alvi)

| Task | Owner |
|------|-------|
| Gateway public routes (no JWT; rate limit) | Zain Alvi |

**Acceptance Criteria**

- Publish article in dashboard → visible on `https://help.localhost/{slug}`
- Draft articles are not publicly accessible
- Help center reflects workspace primary color
- Public URL shown in settings with copy button

**Demo:** End of Week 8

---

## 11. Module 14 — Analytics & Reporting

**Timeline:** Weeks 8–9  
**Objective:** Owners and admins see conversation volume, response metrics, and channel breakdown.  
**Full-stack owner:** Zain Alvi

### 11.1 Full-stack (Zain Alvi)

| Task | Owner |
|------|-------|
| `AnalyticsSnapshot` queries (read-only, tenant-scoped) | Zain Alvi |
| `GET /analytics/overview?from=&to=` (conversations, messages, tickets) | Zain Alvi |
| `GET /analytics/agents` (assigned count, avg first response time) | Zain Alvi |
| `GET /analytics/channels` (web chat, email, WhatsApp mix) | Zain Alvi |
| Optional nightly rollup job for heavy aggregates | Zain Alvi |
| Analytics page: sidebar entry, date range, KPI cards, charts | Zain Alvi |
| Role guard: Owner/Admin only + API client types | Zain Alvi |

### 11.2 Light UI (Khadija Asif)

| Task | Owner |
|------|-------|
| Loading skeletons and empty-state polish for analytics cards | Khadija Asif |

### 11.3 Support (Mariyam Ali)

| Task | Owner |
|------|-------|
| Peer review of analytics endpoints | Mariyam Ali |

**Acceptance Criteria**

- Analytics page loads in &lt; 2s for 30-day range (dev data)
- Channel chart reflects email and WhatsApp conversations after Module 9–10
- Agents without admin role cannot access analytics

**Demo:** End of Week 9

---

## 12. Module 15 — Playwright E2E & Regression

**Timeline:** Week 9  
**Objective:** Critical user flows run automatically in CI; Phase 2 regression checklist completed.

### 12.1 E2E & tests (Zain Alvi + Mariyam Ali)

| Task | Zain Alvi | Mariyam Ali |
|------|-----------|-------------|
| Playwright project setup in `web/e2e` | ✓ | |
| Flow 1: Register → login → inbox | ✓ | |
| Flow 2: Widget message → agent reply | ✓ | |
| Flow 3: Create ticket from conversation | | ✓ |
| Flow 4: Upload attachment → visible in thread | ✓ | |
| Test seed script (`scripts/seed-e2e.ps1`) | ✓ | |
| Expand tenant isolation tests for new endpoints | ✓ | ✓ |
| Module 8–14 API integration tests | ✓ | ✓ |
| CI job: run E2E on PR to `DEV` | ✓ | |

### 12.2 Light support (Khadija Asif)

| Task | Owner |
|------|-------|
| Flow 5: Command palette navigation (simple Playwright flow) | Khadija Asif |
| Add `data-testid` on 2–3 UI elements she polished | Khadija Asif |

### 12.3 Regression checklist

Use an extended checklist based on `docs/MODULE7_REGRESSION_AND_DEMO.md` plus Phase 2 scenarios (email, WhatsApp, attachments, help center, analytics).

**Acceptance Criteria**

- 5 Playwright flows pass locally and in CI
- No P0/P1 bugs open for Phase 2 scope
- Tenant isolation tests pass for all new APIs

**Demo:** End of Week 9

---

## 13. Module 16 — Staging Deployment & Release Prep

**Timeline:** Week 10  
**Objective:** Deploy full stack to Azure staging; document runbook for client UAT.

### 13.1 Tasks

| Task | Zain Alvi | Mariyam Ali | Khadija Asif |
|------|-----------|-------------|--------------|
| Azure Container Apps staging environment | ✓ | | |
| Azure Blob Storage (attachments) | ✓ | | |
| Azure SQL / existing SQL Server staging DB | | ✓ | |
| SendGrid or Azure Communication Services (email) | | ✓ | |
| GitHub Actions: deploy staging on merge to `DEV` | ✓ | ✓ | |
| Environment variable documentation | ✓ | ✓ | |
| Staging smoke test script | ✓ | ✓ | |
| Frontend build against staging API | ✓ | | |
| Help center staging URL verification | | ✓ | |
| Staging UI smoke check (login + inbox open) | | | ✓ |
| Client UAT script (Phase 2) | Shared | Shared | |

**Acceptance Criteria**

- Staging URL accessible for dashboard, API, and help center
- Widget embed works against staging API
- All Phase 2 acceptance criteria pass on staging
- Runbook in `docs/STAGING_RUNBOOK.md` (created in this module)

**Demo:** End of Week 10 — Phase 2 client UAT

---

## 14. Weekly Milestone Schedule

| Week | Focus | Milestone |
|------|-------|-----------|
| 1 | Module 8 started | Blob storage running; upload API in progress |
| 2 | Module 8 complete; Module 9 started | Attachments end-to-end; email channel design |
| 3 | Module 9 | Inbound email → conversation |
| 4 | Module 9 complete; Module 10 started | Outbound email reply; WhatsApp webhook |
| 5 | Module 10 | WhatsApp inbound/outbound |
| 6 | Module 10 complete; Module 11 | WhatsApp demo; email notifications live |
| 7 | Modules 12 + 13 started | Command palette; help center scaffold |
| 8 | Module 13 complete; Module 14 started | Public help center; analytics API |
| 9 | Modules 14 + 15 | Analytics UI; Playwright in CI |
| 10 | Module 16 | **Staging deployment & Phase 2 UAT** |

---

## 15. Progress Tracker

| Module | Zain Alvi | Mariyam Ali | Khadija Asif | Status |
|--------|-----------|-------------|--------------|--------|
| 8 — Attachments | | | | Not started |
| 9 — Email channel | | | | Not started |
| 10 — WhatsApp channel | | | | Not started |
| 11 — Email notifications | | | | Not started |
| 12 — Command palette | | | | Not started |
| 13 — Help center | | | | Not started |
| 14 — Analytics | | | | Not started |
| 15 — E2E & regression | | | | Not started |
| 16 — Staging deployment | | | | Not started |

---

## 16. Task Matrix (Quick Reference)

| Task | Zain Alvi | Mariyam Ali | Khadija Asif |
|------|:---------:|:-----------:|:------------:|
| **Module 8 — Attachments** | | | |
| Blob storage + upload API + inbox/widget UI | ✓ FS | | |
| Widget SignalR attachment metadata | | ✓ | |
| Responsive attachment polish | | | ✓ light |
| **Module 9 — Email** | | | |
| Email channel API + settings page UI | | ✓ FS | |
| Gateway webhook + notification hook | ✓ | | |
| Email channel badge polish | | | ✓ light |
| **Module 10 — WhatsApp** | | | |
| WhatsApp API + settings page UI | ✓ FS | | |
| Customer phone field + API client | | ✓ | |
| Status indicator polish | | | ✓ light |
| **Module 11 — Email notifications** | | | |
| Jobs + preferences API + settings UI | | ✓ FS | |
| Assignment event hooks | ✓ | | |
| **Module 12 — Command palette** | | | |
| Search API + CommandPalette UI | ✓ FS | | |
| Mobile shortcut button | | | ✓ light |
| **Module 13 — Help center** | | | |
| Public API + help center pages | | ✓ FS | |
| Gateway public routes | ✓ | | |
| Typography / SEO polish | | | ✓ light |
| **Module 14 — Analytics** | | | |
| Analytics APIs + dashboard page | ✓ FS | | |
| Loading skeleton polish | | | ✓ light |
| **Module 15 — E2E** | | | |
| Playwright setup + main flows + CI | ✓ | ✓ | |
| 1 simple flow + a few testids | | | ✓ light |
| Integration / tenant tests | ✓ | ✓ | |
| **Module 16 — Deployment** | ✓ | ✓ | ✓ light |

*FS = full-stack owner (API + main UI). light = small polish only.*

---

## 17. Technical Notes

### 17.1 New or Extended Services

| Area | Service | Change |
|------|---------|--------|
| Attachments | Conversation | `MessageAttachment`, blob upload |
| Email channel | Conversation + Workspace | Inbound webhook, outbound sender |
| WhatsApp channel | Conversation + Workspace | Meta webhook, outbound sender |
| Email notifications | Notification | Preferences + Hangfire email jobs |
| Search | New or Gateway aggregation | Unified search endpoint |
| Help center | Knowledge + Workspace | Public read-only routes |
| Analytics | New read models or Ticket/Conversation | Aggregate queries |

### 17.2 Local Development Additions

```powershell
# MinIO (S3-compatible) for attachments — added in Module 8
docker compose up -d

# Widget + dashboard
cd web
npm run dev:dashboard
npm run dev:widget

# E2E (Module 15)
npm run test:e2e
```

| Service | URL |
|---------|-----|
| MinIO console | http://localhost:9001 |
| MailHog | http://localhost:8025 |
| Help center (dev) | http://localhost:3001 (or dashboard sub-route) |

### 17.3 Security Checklist (Phase 2)

| Item | Implementation |
|------|----------------|
| Attachment access | Tenant-scoped signed URLs; short TTL |
| Email webhook | HMAC signature verification |
| WhatsApp webhook | Meta verify token + signature |
| Public help center | No PII; published articles only; rate limit |
| Analytics | Owner/Admin role only |
| Secrets | Azure Key Vault / user-secrets; never commit |

---

## 18. Client Demo Script (Week 10)

1. **Attachments:** Customer sends image via widget → agent views and downloads
2. **Email:** Forward email to support address → appears in inbox → agent replies → customer receives email
3. **WhatsApp:** Send WhatsApp to connected number → conversation in inbox → agent replies
4. **Email notifications:** Assign conversation → assignee receives email alert
5. **Command palette:** Cmd+K → search customer → jump to profile
6. **Help center:** Open public URL → browse published articles
7. **Analytics:** Show 30-day volume, response time, channel breakdown
8. **Regression:** Run Phase 1 demo script (`MODULE7_REGRESSION_AND_DEMO.md`) on staging

---

## 19. Definition of Done (Phase 2)

- [ ] All module acceptance criteria met
- [ ] Swagger updated for every new endpoint
- [ ] Tenant isolation tests for new tenant-scoped APIs
- [ ] Full-stack owners (Zain / Mariyam) sign off on feature UI for their modules
- [ ] Khadija sign-off on light polish items assigned to her
- [ ] Playwright E2E: 5 flows passing
- [ ] Staging deployment healthy
- [ ] `docs/STAGING_RUNBOOK.md` complete
- [ ] Phase 2 progress tracker updated
- [ ] Client UAT script executed on staging

---

## 20. Related Documentation

| Document | Purpose |
|----------|---------|
| `docs/DEVELOPER_PLAN_PHASE1.md` | Phase 1 plan (complete) |
| `docs/TECHNICAL_ROADMAP_PHASE1.md` | Phase 1 technical spec |
| `docs/MODULE7_REGRESSION_AND_DEMO.md` | Phase 1 regression checklist |
| `docs/FORGOT_PASSWORD_WHATSAPP_OTP.md` | Meta WhatsApp API reference |
| `docs/GHCR_CI_SETUP_GUIDE.md` | Container registry CI |
| `docs/PROJECT_GUIDE.md` | Local setup guide |

---

**Document Control**

| Field | Value |
|-------|-------|
| Author | TechHub Development Team |
| Version | 1.1 |
| Classification | Internal |
| Last Updated | July 20, 2026 |

---

*© 2026 TechHub. All rights reserved. Internal use only.*
