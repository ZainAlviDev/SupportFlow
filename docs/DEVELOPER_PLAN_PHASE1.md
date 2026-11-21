# SupportFlow — Phase 1 Developer Plan

**Organization:** TechHub  
**Product:** SupportFlow — AI Customer Support SaaS Platform  
**Phase:** 1 (MVP)  
**Version:** 4.1  
**Date:** July 5, 2026  
**Project Location:** `C:\Projects\SupportFlow`  
**Target Delivery:** 8 weeks (part-time schedule)

---

## 1. Overview

This document defines the Phase 1 development plan, task allocation, milestones, and delivery criteria for SupportFlow. It is intended for internal use by the development team and project stakeholders.

**Schedule:** 11 hours per week (1 hour daily, Monday–Friday, plus a 6-hour session on the weekend).

**Team:** Two full-stack developers working across backend and frontend tasks, with responsibilities divided per module.

---

## 2. Team & Working Model

| Name | Role | Responsibility |
|------|------|----------------|
| **Zain Ali** | Full-Stack Developer | Backend and frontend tasks as assigned per module |
| **Maryam Ali** | Full-Stack Developer | Backend and frontend tasks as assigned per module |

Both developers are full-stack. Tasks are split by module and feature—not by a fixed backend/frontend division. Shared work is completed during paired weekend sessions.

### 2.1 Version Control

| Branch | Purpose |
|--------|---------|
| `master` | Production-ready code |
| `DEV` | Integration branch |
| `ZainDev` | Zain's feature work |
| `MaryamDev` | Maryam's feature work |

All changes merge into `DEV` via pull request with peer review before integration.

### 2.2 Weekly Schedule

| Period | Duration | Activity |
|--------|----------|----------|
| Monday–Friday | 1 hour/day | Stand-up, planning, paired development |
| Weekend (Sat or Sun) | 6 hours | Deep work, integration, module demo |
| **Total** | **11 hours/week** | |

---

## 3. Module 0 — Project Foundation (Complete)

**Completed:** July 5, 2026  
**Completed by:** Zain Ali

### 3.1 Deliverables

| # | Item | Status |
|---|------|--------|
| 1 | Git repository and project structure | Complete |
| 2 | Eight microservices plus YARP API Gateway | Complete |
| 3 | Clean Architecture per service (Domain, Application, Infrastructure, Api) | Complete |
| 4 | MediatR and FluentValidation in Application layer | Complete |
| 5 | Health check endpoint on each API (`GET /health`) | Complete |
| 6 | Gateway routing to all services | Complete |
| 7 | Docker Compose: PostgreSQL, Redis, MailHog | Complete |
| 8 | Utility scripts: `docker-up`, `docker-down`, `redis-seed-config`, `run-all` | Complete |
| 9 | Redis configuration seed script | Complete |
| 10 | README and `.gitignore` | Complete |

### 3.2 Service Ports

| Service | Port | Gateway Route |
|---------|------|---------------|
| Gateway | 5000 | — |
| Identity | 5010 | `/api/v1/auth/*` |
| Workspace | 5020 | `/api/v1/workspaces/*` |
| Conversation | 5030 | `/api/v1/conversations/*`, `/api/v1/widget/*` |
| Ticket | 5040 | `/api/v1/tickets/*` |
| Customer | 5050 | `/api/v1/customers/*` |
| Knowledge | 5060 | `/api/v1/knowledge/*` |
| AI | 5070 | `/api/v1/ai/*` |
| Notification | 5080 | `/api/v1/notifications/*` |

### 3.3 Local Environment Setup

```powershell
cd C:\Projects\SupportFlow
.\scripts\docker-up.ps1
.\scripts\redis-seed-config.ps1
dotnet build
.\scripts\run-all.ps1
```

Gateway health check: http://localhost:5000/health

### 3.4 Remaining Items (Week 1)

- Entity Framework DbContext and initial migrations
- Next.js dashboard scaffold (`web/`)
- Redis/Valkey configuration pattern (HSV reference implementation)

---

## 4. Module 1 — Authentication & Dashboard Shell

**Timeline:** Weeks 1–2  
**Objective:** User registration, login, workspace creation, and dashboard shell.

| Task | Zain Ali | Maryam Ali |
|------|----------|------------|
| Tenant, User, TenantMember entities | ✓ | |
| JWT authentication APIs (register, login, refresh) | ✓ | |
| Login page and form validation | ✓ | |
| EF Core DbContext and initial migration | | ✓ |
| Workspace create/read API | | ✓ |
| Registration page with workspace setup | | ✓ |
| Multi-tenant middleware and global query filters | ✓ | ✓ |
| Dashboard layout (sidebar, header, theme toggle) | | ✓ |
| Placeholder pages (Inbox, Tickets, Customers, Settings) | ✓ | ✓ |

**Acceptance Criteria:** A user can register, log in, create a workspace, and access the dashboard.

**Demo:** End of Week 2

---

## 5. Module 2 — Team Invitations & Settings

**Timeline:** Week 3 (first half)  
**Objective:** Team member invitations and basic workspace settings.

| Task | Zain Ali | Maryam Ali |
|------|----------|------------|
| Member invitation API and MailHog email delivery | ✓ | |
| Settings page tab layout | | ✓ |
| Workspace settings API (name, timezone) | | ✓ |
| Team invitation form UI | ✓ | |
| Settings page integration | Shared | Shared |

**Acceptance Criteria:** An invitation email is received in MailHog (http://localhost:8025).

---

## 6. Module 3 — Conversations & Real-Time Messaging

**Timeline:** Weeks 3–4  
**Objective:** Real-time agent–customer messaging via SignalR.

SignalR hub implementation is assigned to **Zain Ali**.

| Task | Zain Ali | Maryam Ali |
|------|----------|------------|
| Customer, Conversation, Message entities | ✓ | |
| SignalR ConversationHub and Redis backplane | ✓ | |
| Conversation and Message REST APIs | | ✓ |
| SignalR client hook (`useSignalR`) | ✓ | |
| Three-panel inbox UI (list, thread, composer) | | ✓ |
| MessageBubble and composer components | ✓ | |
| Agent assignment and status API | | ✓ |
| Agent assignment and status UI | ✓ | |
| Typing indicators (hub events and UI) | ✓ | ✓ |

**Acceptance Criteria:** Messages appear in real time across two browser sessions.

**Demo:** End of Week 4

---

## 7. Module 4 — Embeddable Chat Widget

**Timeline:** Week 5  
**Objective:** Website widget connected to the agent inbox.

| Task | Zain Ali | Maryam Ali |
|------|----------|------------|
| Widget public API and API key authentication | ✓ | |
| CORS and rate limiting | ✓ | |
| Vite widget application (launcher and chat window) | | ✓ |
| Widget SignalR connection | ✓ | |
| Visitor identification (localStorage) | | ✓ |
| Widget test page | ✓ | |
| Widget branding loaded from API | | ✓ |
| End-to-end widget-to-inbox integration test | Shared | Shared |

**Acceptance Criteria:** A customer message from the widget appears in the agent inbox; agent replies are delivered to the widget.

**Demo:** End of Week 5

---

## 8. Module 5 — Ticketing & Customer Profiles

**Timeline:** Week 6  
**Objective:** Support tickets and customer history.

| Task | Zain Ali | Maryam Ali |
|------|----------|------------|
| Ticket entity and API | ✓ | |
| Ticket list and detail pages | ✓ | |
| Customer entity and timeline API | | ✓ |
| Customer list and detail pages | | ✓ |
| Ticket comments API | ✓ | |
| Create ticket action from inbox | | ✓ |
| Customer sidebar in inbox | ✓ | |

**Acceptance Criteria:** A ticket can be created from a conversation; customer history is visible on the profile page.

**Demo:** End of Week 6

---

## 9. Module 6 — Knowledge Base & AI Suggested Replies

**Timeline:** Week 7  
**Objective:** Knowledge articles and AI-assisted reply suggestions.

Both developers share responsibility for this module.

| Task | Zain Ali | Maryam Ali |
|------|----------|------------|
| pgvector setup and article entities | ✓ | |
| Knowledge CRUD API | | ✓ |
| Article embedding background job (Hangfire) | ✓ | |
| Azure OpenAI integration and suggest-reply API | ✓ | |
| Knowledge base list page | | ✓ |
| Tiptap article editor | ✓ | |
| "Suggest Reply" action in inbox composer | | ✓ |
| AI suggestion panel (accept, edit, dismiss) | ✓ | |
| AI-generated message indicator in thread | | ✓ |

**Acceptance Criteria:** An uploaded article enables relevant AI reply suggestions; the agent reviews and sends the final message.

**Demo:** End of Week 7

---

## 10. Module 7 — Notifications, Settings & Release Preparation

**Timeline:** Week 8  
**Objective:** MVP completion and client demo readiness.

| Task | Zain Ali | Maryam Ali |
|------|----------|------------|
| Notification API and SignalR delivery | ✓ | |
| Notification bell UI | | ✓ |
| Widget settings API | ✓ | |
| Widget settings page | | ✓ |
| Workspace settings API (business hours) | | ✓ |
| Workspace settings UI | ✓ | |
| Tenant isolation integration tests | ✓ | |
| Loading, empty, and error states | | ✓ |
| Full regression testing and bug fixes | Shared ✓ (checklist) | Shared ✓ (checklist) |
| Client demo preparation | Shared ✓ (checklist) | Shared ✓ (checklist) |

**Acceptance Criteria:** All MVP acceptance criteria met; platform ready for client UAT.

**Demo:** End of Week 8 — runnable checklist: [`docs/MODULE7_REGRESSION_AND_DEMO.md`](MODULE7_REGRESSION_AND_DEMO.md)

---

## 11. Weekly Milestone Schedule

| Week | Focus | Milestone |
|------|-------|-----------|
| 1 | Module 0 complete; Module 1 started | Infrastructure running; auth and dashboard initiated |
| 2 | Module 1 complete | Registration, login, and dashboard functional |
| 3 | Modules 2 and 3 started | Team invitations; real-time messaging initiated |
| 4 | Module 3 complete | Inbox with live messaging operational |
| 5 | Module 4 complete | Widget integrated with inbox |
| 6 | Module 5 complete | Ticketing and customer profiles operational |
| 7 | Module 6 complete | Knowledge base and AI suggest-reply functional |
| 8 | Module 7 complete | **MVP release and client demo** |

---

## 12. Progress Tracker

| Module | Zain Ali | Maryam Ali | Status |
|--------|----------|------------|--------|
| 0 — Project Foundation | Complete | — | **Complete** |
| 1 — Authentication & Dashboard | Complete | Complete | **Complete** |
| 2 — Team Invitations | Complete | Complete | **Complete** |
| 3 — Conversations & SignalR | Complete | Complete | **Complete** |
| 4 — Chat Widget | Complete | Complete | **Complete** |
| 5 — Ticketing & Customers | Complete | Complete | **Complete** |
| 6 — Knowledge Base & AI | Complete | Complete | **Complete** |
| 7 — Release Preparation | Complete | Complete | **Complete** (run demo checklist before UAT) |

---

## 13. MVP Scope

### In Scope

- User registration, login, and workspace management
- Team member invitations
- Embeddable chat widget
- Real-time agent inbox
- Conversation assignment and status management
- Ticketing and customer profiles
- Knowledge base with AI-suggested replies
- Widget and workspace settings
- Tenant data isolation

### Out of Scope (Phase 1 — defer if schedule constrained)

- Command palette (Cmd+K)
- File attachments in chat
- Email notifications (in-app notifications only)
- Password reset flow (email + WhatsApp OTP via Meta Cloud API — see `docs/FORGOT_PASSWORD_WHATSAPP_OTP.md` / `.pdf`) — **implemented**; WhatsApp Meta credentials optional (Console in Dev)
- Phone number on registration (ships with the forgot-password lane above) — **implemented**
- End-to-end automated testing (Playwright)
- Azure production deployment

---

## 14. Client Demo Script (Week 8)

Full checklist with ports, regression, and bug log: [`docs/MODULE7_REGRESSION_AND_DEMO.md`](MODULE7_REGRESSION_AND_DEMO.md).

1. Register a business account and create workspace "Acme Corp"
2. Invite an agent; confirm email in MailHog
3. Send a customer message via the embedded widget
4. Reply from the agent inbox in real time
5. Assign and resolve a conversation
6. Create a ticket from an existing conversation
7. Upload a knowledge base article ("Return Policy")
8. Demonstrate AI suggest-reply for a customer inquiry
9. Review customer profile and conversation history
10. Update widget branding settings
11. Show workspace business hours
12. Show in-app notification bell (assignment / new message) and mark as read

---

## 15. Local Environment Reference

| Service | URL / Connection |
|---------|------------------|
| API Gateway | http://localhost:5000/health |
| Identity Service | http://localhost:5010/health |
| PostgreSQL | `localhost:5432` — database: `supportflow`, user: `postgres` |
| Redis | `localhost:6379` |
| MailHog | http://localhost:8025 |
| Dashboard | http://localhost:3000 (available after Module 1) |

---

## 16. Related Documentation

- Technical specification: `docs/TECHNICAL_ROADMAP_PHASE1.md`
- Client proposal: `docs/CUSTOMER_PROPOSAL.pdf`
- Future lane — Forgot password & WhatsApp OTP: `docs/FORGOT_PASSWORD_WHATSAPP_OTP.md` / `docs/FORGOT_PASSWORD_WHATSAPP_OTP.pdf`

---

**Document Control**

| Field | Value |
|-------|-------|
| Author | TechHub Development Team |
| Version | 4.1 |
| Classification | Internal |
| Last Updated | July 5, 2026 |

---

*© 2026 TechHub. All rights reserved. Internal use only.*
