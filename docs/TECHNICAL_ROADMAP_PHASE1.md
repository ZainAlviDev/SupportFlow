# SupportFlow — Phase 1 Technical Roadmap

**Product:** SupportFlow — AI Customer Support SaaS Platform  
**Company:** TechHub  
**Document Type:** Technical Specification & Implementation Roadmap  
**Phase:** 1 — MVP  
**Version:** 1.0  
**Date:** June 27, 2026  
**Status:** Ready for Development

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Solution Structure](#4-solution-structure)
5. [Multi-Tenancy Design](#5-multi-tenancy-design)
6. [Domain Model](#6-domain-model)
7. [Database Schema](#7-database-schema)
8. [Backend API Specification](#8-backend-api-specification)
9. [Real-Time Layer (SignalR)](#9-real-time-layer-signalr)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Chat Widget Architecture](#11-chat-widget-architecture)
12. [AI and RAG Pipeline](#12-ai-and-rag-pipeline)
13. [Background Jobs](#13-background-jobs)
14. [Security Implementation](#14-security-implementation)
15. [Infrastructure and DevOps](#15-infrastructure-and-devops)
16. [Testing Strategy](#16-testing-strategy)
17. [Week-by-Week Implementation Roadmap](#17-week-by-week-implementation-roadmap)
18. [Module Implementation Checklist](#18-module-implementation-checklist)
19. [Environment Variables](#19-environment-variables)
20. [Definition of Done — Phase 1](#20-definition-of-done--phase-1)

---

## 1. Purpose and Scope

### 1.1 Purpose

This document defines the **technical architecture, implementation plan, and delivery roadmap** for SupportFlow Phase 1 (MVP). It is the engineering reference for the TechHub development team.

### 1.2 Phase 1 Goal

Deliver a production-ready MVP where a business can:

- Register, create a workspace, and invite agents
- Embed a branded chat widget on their website
- Receive and reply to customer messages in real time
- Manage tickets and customer profiles
- Upload knowledge articles and use AI-suggested replies

### 1.3 Phase 1 Modules (In Scope)

| Module | Backend | Frontend | Worker |
|--------|---------|----------|--------|
| Identity & Auth | Yes | Yes | — |
| Tenant / Workspace | Yes | Yes | — |
| Conversations & Messages | Yes | Yes | — |
| SignalR Real-Time | Yes | Yes | — |
| Ticketing | Yes | Yes | — |
| Customers (CRM) | Yes | Yes | — |
| Knowledge Base | Yes | Yes | Yes (embeddings) |
| AI Suggest Reply | Yes | Yes | — |
| Notifications | Yes | Yes | Yes (email) |
| Widget (public API) | Yes | Yes (Vite app) | — |
| Settings & Branding | Yes | Yes | — |

### 1.4 Out of Scope (Phase 1)

- Email channel, WhatsApp, SMS
- Automations / workflow rules
- Analytics dashboard
- Stripe billing
- SSO (SAML/OIDC)
- Public help center portal
- Elasticsearch search

---

## 2. Technology Stack

### 2.1 Backend

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | .NET | 8.0 LTS |
| Web Framework | ASP.NET Core | 8.0 |
| Architecture | Clean Architecture + CQRS (MediatR) | — |
| ORM | Entity Framework Core | 8.x |
| Database | PostgreSQL + pgvector extension | 16+ |
| Cache / Pub-Sub | Redis (StackExchange.Redis) | 7.x |
| Real-Time | SignalR + Redis backplane | — |
| Background Jobs | Hangfire + PostgreSQL storage | 1.8.x |
| Auth | ASP.NET Identity + JWT | — |
| Validation | FluentValidation | 12.x |
| Logging | Serilog | 10.x |
| API Docs | Swagger / OpenAPI | 10.x |
| AI | Azure OpenAI SDK | 2.x |
| File Storage | Azure Blob Storage (MinIO locally) | — |

### 2.2 Frontend

| Component | Technology | Version |
|-----------|-----------|---------|
| Dashboard | Next.js (App Router) | 15.x |
| UI Framework | React | 19.x |
| Language | TypeScript | 5.x |
| Monorepo | Turborepo | latest |
| Styling | Tailwind CSS | 4.x |
| Components | shadcn/ui + Radix UI | latest |
| Server State | TanStack Query | 5.x |
| Client State | Zustand | 5.x |
| Forms | React Hook Form + Zod | — |
| Real-Time Client | @microsoft/signalr | latest |
| Animations | Framer Motion | 11.x |
| Rich Text Editor | Tiptap | 2.x |

### 2.3 Chat Widget

| Component | Technology |
|-----------|-----------|
| Build Tool | Vite |
| Framework | React + TypeScript |
| Real-Time | @microsoft/signalr |
| Bundle Target | < 80KB gzipped |

### 2.4 Infrastructure

| Component | Technology |
|-----------|-----------|
| Containers | Docker + docker-compose |
| CI/CD | GitHub Actions |
| Cloud (default) | Azure Container Apps |
| Email (dev) | MailHog |
| Email (prod) | SendGrid / Azure Communication Services |

---

## 3. System Architecture

### 3.1 Architecture Style

**Modular Monolith** — single deployable API with clearly separated bounded contexts. Extract to microservices only when scale requires it (Phase 3+).

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  Next.js Dashboard  │  Vite Chat Widget  │  Swagger (dev)           │
└──────────┬──────────────────────┬───────────────────────────────────┘
           │ REST + JWT            │ REST + API Key + SignalR
           ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SupportFlow.Api (.NET 8)                          │
│  Controllers │ SignalR Hubs │ Middleware │ Filters                  │
└──────────┬──────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 SupportFlow.Application                              │
│  MediatR Commands/Queries │ Validators │ DTOs │ Mappings             │
│  ┌─────────┬─────────┬──────────┬────────┬──────┬──────────────┐    │
│  │ Identity│ Tenants │Conversations│Tickets│ AI  │ Knowledge   │    │
│  └─────────┴─────────┴──────────┴────────┴──────┴──────────────┘    │
└──────────┬──────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SupportFlow.Domain                                 │
│  Entities │ Enums │ Domain Events │ Repository Interfaces            │
└──────────┬──────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                SupportFlow.Infrastructure                            │
│  EF Core │ Redis │ Azure OpenAI │ Blob Storage │ Email │ Identity   │
└──────────┬──────────────────────────────────────────────────────────┘
           │
     ┌─────┴─────┬──────────┬────────────┐
     ▼           ▼          ▼            ▼
 PostgreSQL   Redis    Azure Blob   Azure OpenAI

┌─────────────────────────────────────────────────────────────────────┐
│                   SupportFlow.Worker                                 │
│  Hangfire Jobs: Embeddings, Email, Cleanup                           │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Request Flow (Authenticated Agent)

```
Client → HTTPS → Rate Limiter → JWT Auth Middleware
      → Tenant Resolution Middleware → Controller
      → MediatR Handler → Repository (EF + Tenant Filter)
      → PostgreSQL → Response DTO
```

### 3.3 Request Flow (Widget / Public)

```
Widget → HTTPS → API Key Middleware → Tenant Resolution
       → Widget Controller → Conversation/Message Service
       → SignalR broadcast to agent dashboard
```

---

## 4. Solution Structure

### 4.1 Repository Layout

```
SupportFlow/
├── src/
│   ├── SupportFlow.Api/
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs
│   │   │   ├── WorkspacesController.cs
│   │   │   ├── ConversationsController.cs
│   │   │   ├── TicketsController.cs
│   │   │   ├── CustomersController.cs
│   │   │   ├── KnowledgeController.cs
│   │   │   ├── AiController.cs
│   │   │   └── WidgetController.cs          # Public API
│   │   ├── Hubs/
│   │   │   ├── ConversationHub.cs
│   │   │   └── PresenceHub.cs
│   │   ├── Middleware/
│   │   │   ├── TenantResolutionMiddleware.cs
│   │   │   ├── ApiKeyAuthMiddleware.cs
│   │   │   └── ExceptionHandlingMiddleware.cs
│   │   ├── Filters/
│   │   └── Program.cs
│   │
│   ├── SupportFlow.Application/
│   │   ├── Common/
│   │   │   ├── Behaviors/                   # Validation, Logging
│   │   │   ├── Interfaces/
│   │   │   │   ├── ITenantContext.cs
│   │   │   │   └── ICurrentUserService.cs
│   │   │   └── Mappings/
│   │   ├── Identity/
│   │   │   ├── Commands/ Register, Login, RefreshToken
│   │   │   └── Queries/
│   │   ├── Tenants/
│   │   ├── Conversations/
│   │   ├── Tickets/
│   │   ├── Customers/
│   │   ├── Knowledge/
│   │   ├── AI/
│   │   └── Notifications/
│   │
│   ├── SupportFlow.Domain/
│   │   ├── Common/
│   │   │   ├── BaseEntity.cs
│   │   │   ├── ITenantEntity.cs
│   │   │   └── AuditableEntity.cs
│   │   ├── Entities/
│   │   ├── Enums/
│   │   ├── Events/
│   │   └── Interfaces/
│   │
│   ├── SupportFlow.Infrastructure/
│   │   ├── Persistence/
│   │   │   ├── ApplicationDbContext.cs
│   │   │   ├── Configurations/              # EF Fluent API
│   │   │   ├── Migrations/
│   │   │   └── Repositories/
│   │   ├── Identity/
│   │   ├── AI/
│   │   │   ├── AzureOpenAIProvider.cs
│   │   │   ├── EmbeddingService.cs
│   │   │   └── RagRetriever.cs
│   │   ├── Storage/
│   │   ├── Email/
│   │   ├── Caching/
│   │   └── DependencyInjection.cs
│   │
│   ├── SupportFlow.Worker/
│   │   ├── Jobs/
│   │   │   ├── GenerateEmbeddingsJob.cs
│   │   │   ├── SendEmailNotificationJob.cs
│   │   │   └── CleanupExpiredTokensJob.cs
│   │   └── Program.cs
│   │
│   └── SupportFlow.Shared/
│       ├── Constants/
│       └── Extensions/
│
├── web/
│   ├── apps/
│   │   ├── dashboard/                       # Next.js 15
│   │   └── widget/                          # Vite + React
│   └── packages/
│       ├── ui/                              # shadcn shared components
│       └── api-client/                      # OpenAPI generated types
│
├── tests/
│   ├── SupportFlow.UnitTests/
│   ├── SupportFlow.IntegrationTests/
│   └── SupportFlow.TenantIsolationTests/    # CRITICAL
│
├── docs/
├── docker-compose.yml
├── .github/workflows/ci.yml
└── SupportFlow.slnx
```

### 4.2 Project References

```
Api → Application, Infrastructure
Application → Domain, Shared
Infrastructure → Application, Domain, Shared
Worker → Application, Infrastructure
```

### 4.3 Key Patterns

| Pattern | Usage |
|---------|-------|
| CQRS | MediatR `IRequest<T>` for commands and queries |
| Repository | `IRepository<T>` for data access abstraction |
| Unit of Work | `IUnitOfWork` wrapping `DbContext.SaveChangesAsync` |
| Domain Events | `MessageSentEvent` → notification handler |
| Pipeline Behaviors | Validation, logging, performance timing |
| Global Query Filters | EF Core tenant isolation |

---

## 5. Multi-Tenancy Design

### 5.1 Strategy

**Shared database, tenant-per-row** — every business table has `tenant_id UUID NOT NULL`.

### 5.2 Tenant Context Resolution

| Client | Resolution Method |
|--------|----------------|
| Dashboard (agent) | JWT claim `tenant_id` |
| Widget | `X-Api-Key` header → lookup `tenant_api_keys` table |
| Future subdomain | `{slug}.supportflow.app` → resolve tenant by slug |

### 5.3 EF Core Global Filter

```csharp
// Applied to all ITenantEntity implementations
modelBuilder.Entity<Conversation>()
    .HasQueryFilter(e => e.TenantId == _tenantContext.TenantId);

// Bypass only in system/admin jobs with explicit IgnoreQueryFilters()
```

### 5.4 Roles and Permissions

| Role | Permissions |
|------|------------|
| Owner | Full access, billing (future), delete workspace |
| Admin | Manage team, settings, knowledge base, all conversations |
| Agent | Inbox, tickets, customers, AI tools |
| Viewer | Read-only access to inbox and tickets |

### 5.5 Tenant Isolation Tests (Mandatory in CI)

- User A in Tenant 1 cannot read Tenant 2 conversations via API
- Widget API key scoped to single tenant only
- SignalR groups prefixed with `tenant:{id}:conversation:{id}`

---

## 6. Domain Model

### 6.1 Entity Relationship Diagram

```
Tenant ──┬── TenantMember ── User
         ├── TenantSettings
         ├── TenantApiKey
         ├── Customer ──┬── Conversation ── Message
         │              └── Ticket ── TicketComment
         ├── KnowledgeArticle ── ArticleChunk (with embedding)
         ├── Notification
         └── AiUsageLog
```

### 6.2 Core Entities

#### Tenant
```csharp
public class Tenant : BaseEntity
{
    public string Name { get; set; }
    public string Slug { get; set; }           // unique, URL-safe
    public string Plan { get; set; }           // "free" | "pro" (Phase 3 billing)
    public JsonDocument Settings { get; set; } // timezone, business hours, branding
    public DateTime CreatedAt { get; set; }
}
```

#### User / TenantMember
```csharp
public class User : IdentityUser<Guid> { ... }

public class TenantMember : ITenantEntity
{
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public TenantRole Role { get; set; }       // Owner, Admin, Agent, Viewer
    public DateTime JoinedAt { get; set; }
}
```

#### Conversation
```csharp
public class Conversation : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public Guid CustomerId { get; set; }
    public ConversationStatus Status { get; set; }  // Open, Pending, Resolved, Snoozed
    public Guid? AssigneeId { get; set; }         // TenantMember UserId
    public ChannelType Channel { get; set; }      // WebChat (Phase 1)
    public DateTime? SnoozedUntil { get; set; }
    public DateTime LastMessageAt { get; set; }
    public List<string> Tags { get; set; }
}
```

#### Message
```csharp
public class Message : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public Guid ConversationId { get; set; }
    public SenderType SenderType { get; set; }   // Customer, Agent, System, AI
    public Guid? SenderId { get; set; }
    public string Body { get; set; }
    public bool IsAiGenerated { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<MessageAttachment> Attachments { get; set; }
}
```

#### Ticket
```csharp
public class Ticket : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public Guid? ConversationId { get; set; }
    public Guid CustomerId { get; set; }
    public string Subject { get; set; }
    public string Description { get; set; }
    public TicketPriority Priority { get; set; }  // Low, Medium, High, Urgent
    public TicketStatus Status { get; set; }
    public Guid? AssigneeId { get; set; }
}
```

#### Customer
```csharp
public class Customer : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public string? Email { get; set; }
    public string? Name { get; set; }
    public string? ExternalId { get; set; }        // widget visitor ID
    public JsonDocument Metadata { get; set; }
    public DateTime FirstSeenAt { get; set; }
    public DateTime LastSeenAt { get; set; }
    public List<string> Tags { get; set; }
}
```

#### KnowledgeArticle / ArticleChunk
```csharp
public class KnowledgeArticle : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public string Title { get; set; }
    public string Content { get; set; }          // HTML from Tiptap
    public string? Category { get; set; }
    public ArticleStatus Status { get; set; }    // Draft, Published
}

public class ArticleChunk : ITenantEntity
{
    public Guid TenantId { get; set; }
    public Guid ArticleId { get; set; }
    public string Content { get; set; }
    public Vector Embedding { get; set; }        // pgvector, 1536 dimensions
    public int ChunkIndex { get; set; }
}
```

### 6.3 Enums

```csharp
public enum ConversationStatus { Open, Pending, Resolved, Snoozed }
public enum TicketStatus { New, Open, Pending, Resolved, Closed }
public enum TicketPriority { Low, Medium, High, Urgent }
public enum SenderType { Customer, Agent, System, AI }
public enum TenantRole { Owner, Admin, Agent, Viewer }
public enum ChannelType { WebChat }              // Email, WhatsApp in Phase 2/3
public enum ArticleStatus { Draft, Published }
```

---

## 7. Database Schema

### 7.1 PostgreSQL Setup

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
```

### 7.2 Tables

```sql
-- Identity (ASP.NET Identity tables + custom)
tenants (id UUID PK, name, slug UNIQUE, plan, settings JSONB, created_at)
users (id UUID PK, email UNIQUE, password_hash, email_confirmed, ...)
tenant_members (tenant_id, user_id, role, joined_at, PK(tenant_id, user_id))
refresh_tokens (id, user_id, token_hash, expires_at, revoked_at)
tenant_api_keys (id, tenant_id, key_hash, name, allowed_domains TEXT[], created_at)

customers (id, tenant_id, email, name, external_id, metadata JSONB,
           first_seen_at, last_seen_at, tags TEXT[])
  INDEX: (tenant_id, email), (tenant_id, external_id)

conversations (id, tenant_id, customer_id, status, assignee_id, channel,
               snoozed_until, last_message_at, tags TEXT[], created_at, updated_at)
  INDEX: (tenant_id, status, last_message_at DESC)
  INDEX: (tenant_id, assignee_id, status)

messages (id, tenant_id, conversation_id, sender_type, sender_id,
          body, is_ai_generated, created_at)
  INDEX: (conversation_id, created_at)

message_attachments (id, tenant_id, message_id, file_name, blob_url, mime_type, size_bytes)

tickets (id, tenant_id, conversation_id, customer_id, subject, description,
         priority, status, assignee_id, created_at, updated_at)
  INDEX: (tenant_id, status, assignee_id)

ticket_comments (id, tenant_id, ticket_id, author_id, body, is_internal, created_at)

knowledge_articles (id, tenant_id, title, content, category, status, created_at, updated_at)

article_chunks (id, tenant_id, article_id, content, embedding vector(1536), chunk_index)
  INDEX: HNSW (embedding vector_cosine_ops)

notifications (id, tenant_id, user_id, type, title, body, is_read, created_at)

ai_usage_logs (id, tenant_id, user_id, model, prompt_tokens, completion_tokens,
               cost_usd, created_at)
  INDEX: (tenant_id, created_at)
```

### 7.3 Naming Convention

- Table and column names: `snake_case` via `EFCore.NamingConventions`
- Primary keys: `UUID` (`gen_random_uuid()`)
- Timestamps: `TIMESTAMPTZ` stored as UTC

### 7.4 Migrations Strategy

- One migration per sprint milestone
- Never edit applied migrations — create new ones
- Seed data: demo tenant + admin user for development only

---

## 8. Backend API Specification

**Base URL:** `https://api.supportflow.app/api/v1`  
**Auth:** `Authorization: Bearer {access_token}`  
**Widget Auth:** `X-Api-Key: {tenant_api_key}`

### 8.1 Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register user + create workspace |
| POST | `/auth/login` | Login, return access + refresh tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Revoke refresh token |
| POST | `/auth/forgot-password` | Send reset OTP (email or WhatsApp) — **deferred**; see `docs/FORGOT_PASSWORD_WHATSAPP_OTP.md` |
| POST | `/auth/verify-reset-otp` | Verify OTP → reset token — **deferred** |
| POST | `/auth/reset-password` | Reset with token — **deferred** |
| GET | `/auth/me` | Current user profile |

**Register Request:**
```json
{
  "email": "owner@company.com",
  "password": "SecurePass123!",
  "fullName": "John Smith",
  "workspaceName": "Acme Corp"
}
```

**Login Response:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "abc...",
  "expiresIn": 900,
  "user": { "id": "...", "email": "...", "fullName": "..." },
  "workspace": { "id": "...", "name": "Acme Corp", "slug": "acme-corp", "role": "Owner" }
}
```

### 8.2 Workspace Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces/current` | Current workspace details |
| PATCH | `/workspaces/current` | Update name, settings |
| GET | `/workspaces/current/members` | List team members |
| POST | `/workspaces/current/members/invite` | Invite by email |
| DELETE | `/workspaces/current/members/{userId}` | Remove member |
| PATCH | `/workspaces/current/members/{userId}` | Update role |
| GET | `/workspaces/current/api-keys` | List widget API keys |
| POST | `/workspaces/current/api-keys` | Generate new API key |

### 8.3 Conversation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/conversations` | List with filters: `?status=open&assignee=me&page=1` |
| GET | `/conversations/{id}` | Conversation detail |
| POST | `/conversations` | Create conversation (agent-initiated) |
| PATCH | `/conversations/{id}` | Update status, assignee, tags, snooze |
| GET | `/conversations/{id}/messages` | Paginated messages |
| POST | `/conversations/{id}/messages` | Send message (agent) |

### 8.4 Ticket Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tickets` | List with filters |
| GET | `/tickets/{id}` | Ticket detail |
| POST | `/tickets` | Create ticket |
| PATCH | `/tickets/{id}` | Update fields |
| GET | `/tickets/{id}/comments` | List comments |
| POST | `/tickets/{id}/comments` | Add comment (public or internal) |

### 8.5 Customer Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | Search/list: `?q=john&page=1` |
| GET | `/customers/{id}` | Profile + stats |
| GET | `/customers/{id}/timeline` | Conversations + tickets |
| PATCH | `/customers/{id}` | Update name, tags, metadata |
| POST | `/customers/{id}/notes` | Add internal note |

### 8.6 Knowledge Base Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/knowledge/articles` | List articles |
| GET | `/knowledge/articles/{id}` | Article detail |
| POST | `/knowledge/articles` | Create article (triggers embedding job) |
| PUT | `/knowledge/articles/{id}` | Update (re-embed on content change) |
| DELETE | `/knowledge/articles/{id}` | Delete article + chunks |

### 8.7 AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/suggest-reply` | Generate reply suggestion |
| POST | `/ai/summarize` | Summarize conversation thread |

**Suggest Reply Request:**
```json
{
  "conversationId": "uuid",
  "messageCount": 10
}
```

**Suggest Reply Response:**
```json
{
  "suggestion": "Hi John, thanks for reaching out...",
  "confidence": 0.87,
  "sources": [{ "articleId": "...", "title": "Shipping Policy", "excerpt": "..." }],
  "tokensUsed": 450
}
```

### 8.8 Widget (Public) Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/widget/config` | API Key | Widget branding settings |
| POST | `/widget/conversations` | API Key | Start or resume conversation |
| POST | `/widget/conversations/{id}/messages` | API Key | Customer sends message |
| GET | `/widget/conversations/{id}/messages` | API Key | Poll messages (fallback) |

### 8.9 Standard Response Envelope

```json
// Success
{ "data": { ... }, "meta": { "page": 1, "total": 42 } }

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

### 8.10 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden (wrong role or tenant) |
| 404 | Not found |
| 409 | Conflict (duplicate slug) |
| 429 | Rate limited |
| 500 | Internal error |

---

## 9. Real-Time Layer (SignalR)

### 9.1 Hubs

#### ConversationHub (`/hubs/conversation`)

| Method | Caller | Description |
|--------|--------|-------------|
| `JoinConversation(id)` | Agent/Widget | Join room for message events |
| `LeaveConversation(id)` | Agent/Widget | Leave room |
| `SendMessage(id, body)` | Agent/Widget | Send message (also persists via API) |
| `SendTyping(id)` | Both | Broadcast typing indicator |
| `StopTyping(id)` | Both | Clear typing indicator |

#### PresenceHub (`/hubs/presence`)

| Method | Caller | Description |
|--------|--------|-------------|
| `SetOnline()` | Agent | Mark agent online |
| `SetOffline()` | Agent | Mark agent offline |
| `GetOnlineAgents()` | Agent | List online team members |

### 9.2 Server → Client Events

| Event | Payload | Recipients |
|-------|---------|-----------|
| `MessageReceived` | MessageDto | Conversation room |
| `ConversationUpdated` | ConversationDto | Tenant agent group |
| `TypingStarted` | `{ conversationId, senderName }` | Conversation room |
| `TypingStopped` | `{ conversationId }` | Conversation room |
| `AgentPresenceChanged` | `{ userId, isOnline }` | Tenant agent group |
| `NotificationReceived` | NotificationDto | Specific user |

### 9.3 Group Naming

```
tenant:{tenantId}:agents          — all agents in workspace
tenant:{tenantId}:conversation:{conversationId}
tenant:{tenantId}:user:{userId}  — personal notifications
```

### 9.4 Scale-Out

- Redis backplane for multi-instance SignalR
- Configure in `Program.cs`: `.AddStackExchangeRedis(connectionString)`

---

## 10. Frontend Architecture

### 10.1 Monorepo Structure (Turborepo)

```
web/
├── apps/
│   └── dashboard/
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   └── register/page.tsx
│       │   ├── (dashboard)/
│       │   │   ├── layout.tsx              # Sidebar + header
│       │   │   ├── inbox/page.tsx
│       │   │   ├── tickets/page.tsx
│       │   │   ├── tickets/[id]/page.tsx
│       │   │   ├── customers/page.tsx
│       │   │   ├── customers/[id]/page.tsx
│       │   │   ├── knowledge/page.tsx
│       │   │   ├── knowledge/[id]/page.tsx
│       │   │   └── settings/
│       │   │       ├── page.tsx
│       │   │       ├── team/page.tsx
│       │   │       ├── widget/page.tsx
│       │   │       └── workspace/page.tsx
│       │   └── layout.tsx
│       ├── components/
│       │   ├── inbox/
│       │   │   ├── ConversationList.tsx
│       │   │   ├── ConversationThread.tsx
│       │   │   ├── MessageBubble.tsx
│       │   │   ├── MessageComposer.tsx
│       │   │   └── CustomerSidebar.tsx
│       │   ├── tickets/
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── Header.tsx
│       │   │   └── CommandPalette.tsx
│       │   └── ui/                         # shadcn components
│       ├── hooks/
│       │   ├── useConversations.ts
│       │   ├── useSignalR.ts
│       │   └── useAuth.ts
│       ├── lib/
│       │   ├── api.ts
│       │   └── signalr.ts
│       └── stores/
│           └── inboxStore.ts               # Zustand
│
└── packages/
    ├── ui/                                 # Shared shadcn
    └── api-client/                         # Generated from OpenAPI
```

### 10.2 Key Screens — Technical Spec

#### Inbox (3-Panel Layout)
```
┌──────────────┬────────────────────────┬──────────────┐
│ Conv List    │  Message Thread        │  Customer    │
│ 280px        │  flex-1                │  300px       │
│              │                        │              │
│ - Filters    │  - Message bubbles     │  - Profile   │
│ - Search     │  - Typing indicator    │  - History   │
│ - Status     │  - Composer + AI btn   │  - Tags      │
└──────────────┴────────────────────────┴──────────────┘
```

- Left panel: virtualized list (TanStack Virtual) for performance
- Center: SignalR-driven real-time updates
- Right: TanStack Query for customer data

#### State Management

| State Type | Tool | Examples |
|-----------|------|---------|
| Server data | TanStack Query | Conversations, tickets, customers |
| Real-time | SignalR + Query invalidation | New messages |
| UI state | Zustand | Selected conversation, panel visibility |
| Form state | React Hook Form + Zod | Settings, compose message |

### 10.3 Design System Tokens

```css
/* tailwind.config.ts */
colors: {
  brand: { 50: '#eef2ff', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' },
  surface: { DEFAULT: '#ffffff', dark: '#0f172a' },
  muted: '#f8fafc',
}
borderRadius: { xl: '12px', '2xl': '16px' }
```

### 10.4 Auth Flow (Frontend)

1. Login → store tokens in `httpOnly` cookie (preferred) or secure memory
2. Axios/fetch interceptor attaches `Authorization` header
3. On 401 → attempt refresh → retry or redirect to login
4. `middleware.ts` protects `(dashboard)` routes

---

## 11. Chat Widget Architecture

### 11.1 Embed Code

```html
<script>
  (function(w,d,s,o,f,js,fjs){
    w['SupportFlow']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','sf','https://cdn.supportflow.app/widget.js'));
  sf('init', { apiKey: 'pk_live_...' });
</script>
```

### 11.2 Widget Internal Architecture

```
WidgetLoader (vanilla JS, <5KB)
  └── mounts React app in Shadow DOM (style isolation)
        ├── WidgetButton (floating launcher)
        ├── ChatWindow
        │     ├── Header (branding)
        │     ├── PreChatForm (optional)
        │     ├── MessageList
        │     └── Composer
        └── SignalR connection manager
```

### 11.3 Visitor Identification

1. First visit → generate `visitorId` → store in `localStorage`
2. POST `/widget/conversations` with `visitorId` + optional email/name
3. Backend upserts `Customer` by `external_id = visitorId`
4. Return existing open conversation if one exists

### 11.4 Build Output

- Vite library mode → single `widget.js` + `widget.css`
- Target: ES2020, < 80KB gzipped
- Served from CDN with cache headers

---

## 12. AI and RAG Pipeline

### 12.1 Architecture

```
Agent clicks "Suggest Reply"
  → POST /api/v1/ai/suggest-reply
  → AiOrchestrationService
      1. Load last N messages from conversation
      2. Build search query from recent customer messages
      3. RagRetriever → pgvector cosine similarity (top 5 chunks)
      4. PromptBuilder → assemble system + context + history prompt
      5. AzureOpenAIProvider → gpt-4o-mini completion
      6. Log tokens to ai_usage_logs
      7. Return suggestion + confidence + sources
```

### 12.2 Embedding Pipeline (Async)

```
Admin saves article
  → Save to knowledge_articles
  → Enqueue GenerateEmbeddingsJob (Hangfire)
  → Job: strip HTML → chunk (500 tokens, 50 overlap)
  → Embed each chunk via text-embedding-3-small
  → Upsert article_chunks with vectors
```

### 12.3 Interfaces

```csharp
public interface IAIProvider
{
    Task<ChatCompletionResult> CompleteAsync(ChatCompletionRequest request, CancellationToken ct);
    Task<float[]> EmbedAsync(string text, CancellationToken ct);
}

public interface IRagRetriever
{
    Task<IReadOnlyList<RetrievedChunk>> SearchAsync(Guid tenantId, string query, int topK, CancellationToken ct);
}
```

### 12.4 Prompt Template (Suggest Reply)

```
System: You are a helpful customer support agent for {companyName}.
        Answer based ONLY on the provided knowledge base context.
        If unsure, say you will check with the team.
        Tone: {tone} (from tenant settings)

Context:
{retrieved_chunks}

Conversation history:
{messages}

Draft a reply to the customer's latest message.
```

### 12.5 Guardrails

- Max input tokens: 8,000 per request
- PII regex redaction before LLM call (email, phone, credit card patterns)
- All AI messages flagged `is_ai_generated = true`
- No auto-send in Phase 1 — agent must click Send
- Rate limit: 20 AI requests per agent per hour (configurable)

---

## 13. Background Jobs

### 13.1 Hangfire Configuration

- Storage: PostgreSQL (same DB, `hangfire` schema)
- Server: `SupportFlow.Worker` project
- Dashboard: `/hangfire` (admin only, dev/staging)

### 13.2 Jobs

| Job | Trigger | Description |
|-----|---------|-------------|
| `GenerateEmbeddingsJob` | Article create/update | Chunk + embed article |
| `SendEmailNotificationJob` | MessageSentEvent | Email agent on assignment |
| `SendInviteEmailJob` | Member invite | Team invite email |
| `CleanupExpiredTokensJob` | Cron: daily | Remove expired refresh tokens |
| `ProcessAttachmentJob` | File upload | Virus scan placeholder, resize images |

---

## 14. Security Implementation

### 14.1 Authentication

```csharp
// JWT Claims
{
  "sub": "user-id",
  "email": "agent@company.com",
  "tenant_id": "tenant-uuid",
  "role": "Agent",
  "jti": "unique-token-id"
}
// Access token: 15 min | Refresh token: 7 days (rotated on use)
```

### 14.2 Security Checklist

| Item | Implementation |
|------|---------------|
| HTTPS | Enforced, HSTS header |
| CORS | Dashboard: `app.supportflow.app`; Widget: tenant allowed domains |
| Rate limiting | ASP.NET `RateLimiter` — auth: 10/min, widget: 60/min |
| Input validation | FluentValidation on all commands |
| SQL injection | EF Core parameterized queries only |
| XSS | Sanitize HTML in knowledge articles (Ganss.Xss) |
| File uploads | Max 10MB, whitelist: jpg, png, gif, pdf |
| API keys | Store SHA-256 hash only, show full key once on create |
| Tenant isolation | Global EF filters + integration tests |
| Secrets | Azure Key Vault / environment variables, never in code |

---

## 15. Infrastructure and DevOps

### 15.1 docker-compose.yml (Local Development)

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: supportflow
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  mailhog:
    image: mailhog/mailhog
    ports: ["1025:1025", "8025:8025"]

  api:
    build: ./src/SupportFlow.Api
    ports: ["5000:8080"]
    depends_on: [postgres, redis]
    environment:
      ConnectionStrings__Default: "Host=postgres;Database=supportflow;..."
      ConnectionStrings__Redis: "redis:6379"

  worker:
    build: ./src/SupportFlow.Worker
    depends_on: [postgres, redis]

  dashboard:
    build: ./web/apps/dashboard
    ports: ["3000:3000"]
```

### 15.2 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
jobs:
  backend:
  - dotnet restore
  - dotnet build
  - dotnet test (unit + integration + tenant isolation)

  frontend:
  - npm ci
  - eslint + tsc
  - build dashboard + widget

  docker:
  - build images on merge to main
  - push to Azure Container Registry
  - deploy to staging (Azure Container Apps)
```

### 15.3 Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| local | Development | localhost:5000 / :3000 |
| staging | QA + client demos | staging.supportflow.app |
| production | Live | app.supportflow.app |

---

## 16. Testing Strategy

### 16.1 Test Pyramid

| Layer | Tool | Coverage Target |
|-------|------|----------------|
| Unit | xUnit + Moq + FluentAssertions | Domain logic, validators, handlers |
| Integration | WebApplicationFactory + Testcontainers | API endpoints, DB |
| Tenant Isolation | Custom test suite | 100% of tenant-scoped endpoints |
| E2E | Playwright | Critical user flows |
| Load | k6 (optional) | SignalR + message throughput |

### 16.2 Critical Test Cases

```
TENANT-001: Agent in Tenant A cannot GET Tenant B conversation → 404
TENANT-002: Widget API key cannot access other tenant data
TENANT-003: SignalR group isolation — Tenant A agent not in Tenant B room
AUTH-001:   Expired token returns 401
AUTH-002:   Refresh token rotation invalidates old token
CONV-001:   Message sent via widget appears in agent inbox < 2s
AI-001:     Suggest reply returns confidence + sources
AI-002:     AI message flagged is_ai_generated=true
```

### 16.3 E2E Flows (Playwright)

1. Register → create workspace → land on inbox
2. Open widget test page → send message → agent sees in inbox → reply
3. Create ticket from conversation → update status
4. Upload knowledge article → AI suggest reply returns relevant draft

---

## 17. Week-by-Week Implementation Roadmap

### Sprint 0 — Project Setup (Days 1–3)

| Task | Owner | Deliverable |
|------|-------|-------------|
| Initialize git repo | DevOps | GitHub repo with branch protection |
| docker-compose up | Backend | Postgres + Redis + MailHog running |
| Remove template code | Backend | Clean Api/Worker projects |
| Add EF Core + initial migration | Backend | Empty schema migration |
| Scaffold Next.js monorepo | Frontend | Turborepo + dashboard shell |
| Configure CI pipeline | DevOps | Build passing on push |

---

### Weeks 1–2 — Foundation: Auth, Tenants, Dashboard Shell

**Backend:**
- [ ] `Tenant`, `User`, `TenantMember`, `RefreshToken` entities
- [ ] ASP.NET Identity setup with custom `User` entity
- [ ] JWT token service (access + refresh)
- [x] `ITenantContext` + `TenantResolutionMiddleware`
- [x] EF global query filters for `ITenantEntity`
- [ ] Endpoints: register, login, refresh, logout, me
- [ ] Workspace CRUD + member invite (email via MailHog)
- [ ] Serilog + exception middleware
- [ ] Swagger with JWT auth

**Frontend:**
- [ ] shadcn/ui setup, Tailwind theme (TechHub brand colors)
- [ ] Auth pages: login, register
- [x] Dashboard layout: sidebar, header, theme toggle
- [ ] Auth context + token management
- [ ] Protected route middleware
- [ ] Settings → team page (invite form)

**Exit criteria:** User can register, create workspace, invite member, see empty dashboard.

---

### Weeks 3–4 — Conversations, Messages, SignalR

**Backend:**
- [ ] `Customer`, `Conversation`, `Message`, `MessageAttachment` entities
- [ ] Conversation repository + MediatR handlers
- [ ] REST endpoints: conversations CRUD, messages list/send
- [ ] `ConversationHub` + `PresenceHub` with Redis backplane
- [ ] Domain event: `MessageSentEvent` → SignalR broadcast
- [ ] File upload to blob storage (local: filesystem or MinIO)
- [ ] Widget API key entity + middleware

**Frontend:**
- [ ] `useSignalR` hook
- [ ] Inbox page shell (3-panel layout)
- [ ] ConversationList component with filters
- [ ] MessageThread + MessageBubble components
- [ ] MessageComposer with send

**Exit criteria:** Agent can create conversation and send messages via API; SignalR delivers in real time.

---

### Weeks 5–6 — Widget + Inbox UI

**Backend:**
- [ ] Widget public endpoints: config, start conversation, send message
- [ ] Visitor identification via `external_id`
- [ ] CORS configuration per tenant allowed domains
- [ ] Rate limiting on widget endpoints

**Widget (Vite):**
- [ ] Widget shell: launcher button + chat window
- [ ] Shadow DOM mounting
- [ ] SignalR connection from widget
- [ ] Pre-chat form (name, email)
- [ ] Branding from `/widget/config` API
- [ ] Build pipeline → `widget.js` bundle

**Frontend (Dashboard):**
- [ ] Wire inbox to real API + SignalR
- [ ] Typing indicators
- [ ] Conversation assignment + status changes
- [ ] Customer sidebar (basic profile)
- [ ] Command palette (Cmd+K)

**Exit criteria:** Widget embedded on test page; customer message appears in agent inbox in real time.

---

### Weeks 7–8 — Ticketing + Customers

**Backend:**
- [ ] `Ticket`, `TicketComment` entities + endpoints
- [ ] Create ticket from conversation
- [ ] Customer search, profile, timeline endpoints
- [ ] Customer notes and tags

**Frontend:**
- [ ] Tickets list page (table with filters)
- [ ] Ticket detail page with comments
- [ ] Create ticket from inbox action
- [ ] Customers list + detail page
- [ ] Customer timeline component

**Exit criteria:** Full ticket lifecycle works; customer profile shows all history.

---

### Weeks 9–10 — Knowledge Base + AI

**Backend:**
- [ ] `KnowledgeArticle`, `ArticleChunk` entities
- [ ] pgvector setup + HNSW index
- [ ] Knowledge CRUD endpoints
- [ ] `GenerateEmbeddingsJob` (Hangfire)
- [ ] `AzureOpenAIProvider` + `RagRetriever`
- [ ] `POST /ai/suggest-reply` endpoint
- [ ] `AiUsageLog` tracking
- [ ] PII redaction service

**Frontend:**
- [ ] Knowledge base list + Tiptap editor
- [ ] "Suggest Reply" button in composer
- [ ] AI suggestion panel (accept/edit/dismiss)
- [ ] AI message badge in thread

**Exit criteria:** Upload article → AI suggests relevant reply with sources.

---

### Weeks 11–12 — Notifications, Settings, QA, Deploy

**Backend:**
- [ ] `Notification` entity + in-app notifications via SignalR
- [ ] `SendEmailNotificationJob`
- [ ] Workspace settings endpoints (branding, business hours)
- [ ] Widget settings (colors, position, welcome message)
- [ ] Tenant isolation test suite (full)
- [ ] Performance pass on conversation list query

**Frontend:**
- [ ] Settings: workspace, widget customization, notifications
- [ ] Widget preview in settings
- [ ] Notification bell + dropdown
- [ ] Polish: loading states, empty states, error boundaries
- [ ] Responsive tablet layout

**DevOps:**
- [ ] Staging deployment (Azure Container Apps)
- [ ] Environment secrets configured
- [ ] Playwright E2E tests passing
- [ ] Load test SignalR (basic)

**Exit criteria:** All Phase 1 success criteria met; staging demo ready for client UAT.

---

## 18. Module Implementation Checklist

### Identity Module
- [ ] User registration with workspace creation (atomic transaction)
- [ ] Email verification token generation
- [ ] JWT access token (15 min) + refresh token (7 days)
- [ ] Refresh token rotation
- [ ] Password reset flow
- [ ] Role-based authorization policies

### Tenant Module
- [ ] Slug generation and uniqueness validation
- [ ] Tenant settings JSONB schema
- [ ] Member invite with expiring invite token
- [ ] API key generation (show once, store hash)
- [ ] Allowed domains for widget CORS

### Conversation Module
- [ ] Conversation lifecycle state machine
- [ ] Snooze with `snoozed_until` auto-reopen job
- [ ] Message pagination (cursor-based)
- [ ] Attachment upload + blob URL generation
- [ ] Unread count per conversation

### Ticket Module
- [ ] Status transition validation
- [ ] Internal vs public comments
- [ ] Link/unlink conversation
- [ ] Ticket number generation (human-readable: `TKT-0001`)

### Customer Module
- [ ] Upsert by `external_id` (widget visitor)
- [ ] Merge on email match
- [ ] Timeline aggregation query
- [ ] Full-text search on name/email

### Knowledge Module
- [ ] HTML content storage
- [ ] Chunking algorithm (500 tokens, 50 overlap)
- [ ] Embedding upsert on content change
- [ ] Published-only articles in RAG search

### AI Module
- [ ] `IAIProvider` abstraction
- [ ] RAG retrieval with similarity threshold (min 0.7)
- [ ] Confidence score calculation
- [ ] Token usage logging per tenant
- [ ] Rate limiting per agent

### Notification Module
- [ ] In-app notification creation on events
- [ ] SignalR push to user group
- [ ] Email template for assignment notification
- [ ] Mark as read endpoint

---

## 19. Environment Variables

```bash
# Database
ConnectionStrings__Default=Host=localhost;Database=supportflow;Username=postgres;Password=postgres
ConnectionStrings__Redis=localhost:6379

# JWT
Jwt__Secret=<256-bit-secret>
Jwt__Issuer=supportflow.app
Jwt__Audience=supportflow.app
Jwt__AccessTokenExpiryMinutes=15
Jwt__RefreshTokenExpiryDays=7

# Azure OpenAI
AzureOpenAI__Endpoint=https://xxx.openai.azure.com
AzureOpenAI__ApiKey=<key>
AzureOpenAI__ChatDeployment=gpt-4o-mini
AzureOpenAI__EmbeddingDeployment=text-embedding-3-small

# Storage
Storage__Provider=AzureBlob          # or Local / MinIO
Storage__ConnectionString=<blob-connection>
Storage__Container=attachments

# Email
Email__Provider=Smtp               # or SendGrid
Email__SmtpHost=localhost
Email__SmtpPort=1025
Email__FromAddress=noreply@supportflow.app

# App
App__DashboardUrl=http://localhost:3000
App__WidgetCdnUrl=http://localhost:4173
App__Environment=Development
```

---

## 20. Definition of Done — Phase 1

Phase 1 is **technically complete** when:

### Functional
- [ ] All API endpoints in Section 8 implemented and documented in Swagger
- [ ] Widget embeddable and functional on external test page
- [ ] SignalR real-time messaging works agent ↔ customer
- [ ] AI suggest-reply returns grounded suggestions from knowledge base
- [ ] All user roles enforce correct permissions

### Quality
- [ ] Unit test coverage ≥ 70% on Application layer
- [ ] All TENANT-* isolation tests pass
- [ ] Playwright E2E: 4 critical flows pass
- [ ] No P1/P2 bugs open on staging
- [ ] API p95 response time < 300ms (staging load test)

### DevOps
- [ ] docker-compose runs full stack locally
- [ ] CI pipeline green on main branch
- [ ] Staging environment deployed and accessible
- [ ] Environment variables documented
- [ ] Database migrations run successfully on staging

### Documentation
- [ ] Swagger/OpenAPI spec complete
- [ ] README with local setup instructions
- [ ] Widget embed documentation for clients

---

*© 2026 TechHub. Internal Technical Document — Confidential.*  
*SupportFlow Phase 1 Technical Roadmap v1.0*
