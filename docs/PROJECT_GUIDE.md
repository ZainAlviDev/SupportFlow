# SupportFlow — Complete Project Guide

**Repository:** `https://github.com/merium6/SupportFlow`  
**Version:** 1.0 · July 2026  
**Team:** TechHub · Zain Ali · Maryam Ali

---

## Part 1 — VS Code mein kaise chalayein (START HERE)

### Pehli dafa setup

1. **VS Code kholo** → **File → Open Folder** → `C:\Projects\SupportFlow`
2. Extensions install karo (popup aaye to Install dabao):
   - **C# Dev Kit** — backend .NET
   - **Docker** — Postgres, Redis containers
   - **ESLint** + **Tailwind CSS IntelliSense** — frontend
3. **Terminal** kholo: `` Ctrl + ` ``

```powershell
# --- Infrastructure (Docker) ---
docker compose up -d
.\scripts\redis-seed-config.ps1

# --- Frontend (ek dafa) ---
cd web
npm install
copy apps\dashboard\.env.example apps\dashboard\.env.local
cd ..
```

### Sirf Frontend chalana

```powershell
cd C:\Projects\SupportFlow\web
npm run dev:dashboard
```

Browser: **http://localhost:3000**  
Login: http://localhost:3000/login (placeholder — koi bhi email/password)

**VS Code shortcut:** `Ctrl+Shift+P` → **Tasks: Run Task** → **Frontend: Dashboard (Next.js)**

### Sirf Backend chalana

```powershell
cd C:\Projects\SupportFlow
dotnet build
.\scripts\run-all.ps1
```

Health check: **http://localhost:5000/health**

**VS Code shortcut:** `F5` → dropdown se **Gateway (:5000)** ya **Backend: Gateway + Identity**

### Poora stack (Frontend + Backend)

| Terminal | Command | URL |
|----------|---------|-----|
| 1 | `docker compose up -d` | Postgres :5432, Redis :6379, MailHog :8025 |
| 2 | `.\scripts\run-all.ps1` | Gateway :5000, APIs :5010–5080 |
| 3 | `cd web` → `npm run dev:dashboard` | Dashboard :3000 |
| 4 (optional) | `cd web` → `npm run dev:widget` | Widget :4173 |

### Useful VS Code files

| File | Kya karta hai |
|------|---------------|
| `.vscode/launch.json` | F5 se backend debug (Gateway, Identity, etc.) |
| `.vscode/tasks.json` | Docker, backend, frontend tasks |
| `.vscode/extensions.json` | Recommended extensions list |

---

## Part 2 — Project overview

SupportFlow ek **AI Customer Support SaaS** hai — microservices backend + Next.js dashboard + embeddable chat widget.

```
                    ┌─────────────────────┐
                    │  Next.js Dashboard  │  :3000
                    │  (web/apps/dashboard)│
                    └──────────┬──────────┘
                               │ HTTP /api/v1
                    ┌──────────▼──────────┐
                    │   YARP Gateway      │  :5000
                    │   (src/Gateway)     │
                    └──────────┬──────────┘
           ┌───────────────────┼───────────────────┐
           ▼         ▼         ▼         ▼           ▼
      Identity  Workspace  Conversation  Ticket  ... (8 APIs)
       :5010     :5020        :5030       :5040

      ┌──────────────┐     ┌──────────────────────┐
      │ Vite Widget  │     │ Docker: Postgres,    │
      │   :4173      │     │ Redis, MailHog       │
      └──────────────┘     └──────────────────────┘
```

---

## Part 3 — Root folder files

| File / Folder | Description |
|---------------|-------------|
| `SupportFlow.sln` | Visual Studio solution — saare 35 .NET projects |
| `README.md` | Quick start, ports, architecture summary |
| `CONFIG.md` | GitHub Actions + GHCR setup guide |
| `docker-compose.yml` | Local infra: Postgres, Redis, MailHog |
| `docker-compose.staging.yml` | Staging deploy — GHCR images pull karta hai |
| `.dockerignore` | Docker build se exclude files |
| `GatewayDockerfile` | Gateway service Docker image |
| `IdentityDockerfile` | Identity API Docker image |
| `WorkspaceDockerfile` | Workspace API Docker image |
| `ConversationDockerfile` | Conversation API Docker image |
| `TicketDockerfile` | Ticket API Docker image |
| `CustomerDockerfile` | Customer API Docker image |
| `KnowledgeDockerfile` | Knowledge API Docker image |
| `AIDockerfile` | AI API Docker image |
| `NotificationDockerfile` | Notification API Docker image |
| `.github/workflows/build-and-push-images.yml` | CI/CD — PR merge par GHCR push |
| `.vscode/` | VS Code launch, tasks, extensions |
| `docs/` | Developer plans, guides, PDFs |
| `scripts/` | PowerShell helper scripts |
| `src/` | Backend .NET microservices |
| `web/` | Frontend monorepo (Next.js + Vite) |

---

## Part 4 — Backend (`src/`)

### 4.1 Structure pattern (har service same)

```
src/Services/{Name}/
├── SupportFlow.{Name}.Api            ← HTTP entry, Controllers, Program.cs
├── SupportFlow.{Name}.Application    ← MediatR commands/queries, validators
├── SupportFlow.{Name}.Domain         ← Entities, interfaces
└── SupportFlow.{Name}.Infrastructure ← EF Core, external services
```

### 4.2 Gateway

| File | Description |
|------|-------------|
| `src/Gateway/SupportFlow.Gateway/Program.cs` | YARP reverse proxy startup |
| `src/Gateway/SupportFlow.Gateway/appsettings.json` | Routes to 8 services, ports |
| `src/Gateway/SupportFlow.Gateway/Services/GatewayHealthService.cs` | Aggregates all service health |

**Port:** 5000  
**Routes:** `/api/v1/auth/*`, `/workspaces/*`, `/conversations/*`, etc.

### 4.3 Shared libraries

| Project | Description |
|---------|-------------|
| `src/Shared/SupportFlow.Shared.Kernel` | BaseEntity, ITenantEntity |
| `src/Shared/SupportFlow.Shared.Contracts` | Shared DTOs (HealthCheckResponse) |

### 4.4 Microservices (8 services)

| Service | Port | API Project | Gateway route |
|---------|------|-------------|---------------|
| Identity | 5010 | `SupportFlow.Identity.Api` | `/api/v1/auth/*` |
| Workspace | 5020 | `SupportFlow.Workspace.Api` | `/api/v1/workspaces/*` |
| Conversation | 5030 | `SupportFlow.Conversation.Api` | `/api/v1/conversations/*`, `/widget/*` |
| Ticket | 5040 | `SupportFlow.Ticket.Api` | `/api/v1/tickets/*` |
| Customer | 5050 | `SupportFlow.Customer.Api` | `/api/v1/customers/*` |
| Knowledge | 5060 | `SupportFlow.Knowledge.Api` | `/api/v1/knowledge/*` |
| AI | 5070 | `SupportFlow.AI.Api` | `/api/v1/ai/*` |
| Notification | 5080 | `SupportFlow.Notification.Api` | `/api/v1/notifications/*` |

**Har API mein abhi:**
- `Program.cs` — app startup
- `Controllers/HealthController.cs` — health endpoint
- `Application/Health/Queries/` — MediatR health query
- `Application/DependencyInjection.cs` — MediatR + FluentValidation register
- `Infrastructure/DependencyInjection.cs` — infrastructure services

---

## Part 5 — Frontend (`web/`)

### 5.1 Monorepo root

| File | Description |
|------|-------------|
| `web/package.json` | Turborepo root, workspaces config |
| `web/turbo.json` | Build/dev task pipeline |
| `web/README.md` | Frontend quick start |
| `web/package-lock.json` | Locked dependency versions |

### 5.2 Shared packages

#### `web/packages/ui/` — Shared UI components

| File | Description |
|------|-------------|
| `src/button.tsx` | Primary/secondary/ghost button |
| `src/card.tsx` | Card, CardHeader, CardContent |
| `src/input.tsx` | Form text input |
| `src/label.tsx` | Form label |
| `src/globals.css` | Tailwind base imports |
| `src/index.ts` | Package exports |

#### `web/packages/api-client/` — API client

| File | Description |
|------|-------------|
| `src/routes.ts` | Gateway API paths (`/auth/login`, `/tickets`, etc.) |
| `src/types.ts` | TypeScript types (User, Workspace, AuthTokens) |
| `src/client.ts` | `ApiClient` class — fetch + Bearer token |
| `src/index.ts` | Package exports |

### 5.3 Dashboard app (`web/apps/dashboard/`)

Next.js 15 App Router — agent dashboard.

#### Config files

| File | Description |
|------|-------------|
| `package.json` | Dependencies: Next.js, React, Zustand |
| `next.config.ts` | Transpile shared packages |
| `tsconfig.json` | TypeScript paths (`@/*`) |
| `tailwind.config.ts` | Brand colors (#6366f1 indigo) |
| `postcss.config.mjs` | Tailwind + Autoprefixer |
| `.env.example` | API URLs template |
| `.env.local` | Local env (copy from .env.example) |
| `middleware.ts` | Route protection (auth guard) |

#### App pages (`app/`)

| Path | File | Description | Module |
|------|------|-------------|--------|
| `/` | `app/page.tsx` | Redirect → `/inbox` | — |
| `/login` | `(auth)/login/page.tsx` | Login form | Module 1 |
| `/register` | `(auth)/register/page.tsx` | Register + workspace | Module 1 |
| `/inbox` | `(dashboard)/inbox/page.tsx` | 3-panel inbox layout | Module 3 |
| `/tickets` | `(dashboard)/tickets/page.tsx` | Ticket list | Module 5 |
| `/tickets/[id]` | `tickets/[id]/page.tsx` | Ticket detail | Module 5 |
| `/customers` | `customers/page.tsx` | Customer list | Module 5 |
| `/customers/[id]` | `customers/[id]/page.tsx` | Customer detail | Module 5 |
| `/knowledge` | `knowledge/page.tsx` | Knowledge articles | Module 6 |
| `/knowledge/[id]` | `knowledge/[id]/page.tsx` | Article editor | Module 6 |
| `/settings` | `settings/page.tsx` | Settings hub | Module 2/7 |
| `/settings/team` | `settings/team/page.tsx` | Team invitations | Module 2 |
| `/settings/widget` | `settings/widget/page.tsx` | Widget branding | Module 7 |
| `/settings/workspace` | `settings/workspace/page.tsx` | Workspace config | Module 2 |

#### Layouts

| File | Description |
|------|-------------|
| `app/layout.tsx` | Root layout, AuthProvider |
| `app/(auth)/layout.tsx` | Centered auth card layout |
| `app/(dashboard)/layout.tsx` | Sidebar + Header shell |

#### Components

| File | Description |
|------|-------------|
| `components/layout/Sidebar.tsx` | Left nav: Inbox, Tickets, Customers, Knowledge, Settings |
| `components/layout/Header.tsx` | Top bar: workspace name, user, logout, theme |
| `components/layout/PlaceholderPage.tsx` | "Coming in Module X" placeholder |
| `components/inbox/ConversationList.tsx` | Inbox panels (Module 3 scaffold) |

#### Hooks, lib, stores

| File | Description |
|------|-------------|
| `hooks/useAuth.tsx` | Login/logout context (placeholder token) |
| `hooks/useSignalR.ts` | SignalR hook placeholder (Module 3) |
| `hooks/useConversations.ts` | Conversations data placeholder (Module 3) |
| `lib/api.ts` | API client instance → gateway :5000 |
| `lib/signalr.ts` | SignalR hub URLs |
| `stores/inboxStore.ts` | Zustand — selected conversation ID |

### 5.4 Widget app (`web/apps/widget/`)

Vite + React — embeddable chat widget (Module 4).

| File | Description |
|------|-------------|
| `package.json` | Vite + React dependencies |
| `vite.config.ts` | Library build → `widget.js` |
| `index.html` | Dev preview page |
| `src/main.tsx` | Widget app entry |
| `src/WidgetLoader.ts` | Shadow DOM loader (Module 4) |
| `src/components/WidgetButton.tsx` | Floating chat launcher |
| `src/components/ChatWindow.tsx` | Chat window shell |
| `src/lib/signalr.ts` | Widget SignalR placeholder |

**Port:** 4173

---

## Part 6 — Scripts (`scripts/`)

| Script | Description |
|--------|-------------|
| `docker-up.ps1` | `docker compose up -d` + health wait |
| `docker-down.ps1` | Stop all containers |
| `redis-seed-config.ps1` | Seed JWT/DB config keys in Redis |
| `run-all.ps1` | Start gateway + 8 APIs in separate windows |

---

## Part 7 — Docs (`docs/`)

| File | Description |
|------|-------------|
| `DEVELOPER_PLAN_PHASE1.md` | Team plan, modules, milestones |
| `TECHNICAL_ROADMAP_PHASE1.md` | Full architecture, API spec, DB schema |
| `GHCR_CI_SETUP_GUIDE.md` | Docker CI/CD + GHCR workflow guide |
| `PROJECT_GUIDE.md` | **Yeh file** — complete project reference |
| `build-dev-pdf.mjs` | Developer plan → PDF generator |
| `build-ghcr-guide-pdf.mjs` | GHCR guide → PDF generator |
| `build-project-guide-pdf.mjs` | Project guide → PDF generator |

---

## Part 8 — Docker & CI/CD

### Local Docker

| File | Use |
|------|-----|
| `docker-compose.yml` | Dev: Postgres + Redis + MailHog |
| `docker-compose.staging.yml` | Server: GHCR images + infra |

### CI/CD

| File | Trigger | Result |
|------|---------|--------|
| `build-and-push-images.yml` | PR merge → `dev` or `staging` | 9 images → `ghcr.io/merium6/supportflow/*` |

**Tags:** `dev` branch → `:dev` | `staging` → `:staging_env1` + `:staging_env2`

---

## Part 9 — Environment variables

### Frontend (`web/apps/dashboard/.env.local`)

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_GATEWAY_URL=http://localhost:5000
NEXT_PUBLIC_SIGNALR_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Widget (`web/apps/widget/.env`)

```
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SIGNALR_URL=http://localhost:5000
```

---

## Part 10 — Phase 1 modules map

| Module | Week | Backend | Frontend |
|--------|------|---------|----------|
| 0 — Foundation | Done | Microservices scaffold, Docker | `web/` scaffold |
| 1 — Auth & Shell | 1–2 | JWT, register, login | Login, register, dashboard layout |
| 2 — Team | 3 | Invitations, MailHog | Settings team page |
| 3 — Inbox | 3–4 | SignalR, conversations | 3-panel inbox UI |
| 4 — Widget | 5 | Widget public API | Vite embeddable widget |
| 5 — Tickets | 6 | Ticket + customer APIs | Ticket/customer pages |
| 6 — Knowledge & AI | 7 | KB + AI suggest | Knowledge editor, AI button |
| 7 — Release | 8 | Notifications | Widget settings, polish |

---

## Part 11 — Quick troubleshooting

| Problem | Fix |
|---------|-----|
| Frontend `npm install` fail | Internet check karo, dubara `npm install` |
| Port 3000 busy | `npx kill-port 3000` ya alag port use karo |
| Backend health fail | Pehle `docker compose up -d`, phir `run-all.ps1` |
| Login kaam nahi | Backend chalao (Identity :5010) — abhi placeholder auth hai |
| VS Code F5 error | Pehle `dotnet build` chalao |

---

**Document:** SupportFlow Project Guide v1.0  
**Author:** TechHub Development Team
