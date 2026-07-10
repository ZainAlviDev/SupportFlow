# SupportFlow Web

Frontend monorepo for SupportFlow — mirrors the backend microservices architecture.

## Structure

```
web/
├── apps/
│   ├── dashboard/     # Next.js 15 — agent dashboard (:3000)
│   └── widget/        # Vite + React — embeddable chat widget (:4173)
└── packages/
    ├── ui/            # Shared UI components (shadcn-style)
    └── api-client/    # API types + fetch client (gateway /api/v1)
```

## Quick start

```powershell
cd C:\Projects\SupportFlow\web
npm install
npm run dev:dashboard    # http://localhost:3000
npm run dev:widget       # http://localhost:4173
```

## API

All frontend apps call the **YARP gateway**:

```
http://localhost:5000/api/v1
```

See `apps/dashboard/.env.example` for environment variables.

## Modules (Phase 1)

| Module | Dashboard routes |
|--------|------------------|
| 1 — Auth & Shell | `/login`, `/register`, dashboard layout |
| 2 — Team | `/settings/team` |
| 3 — Inbox | `/inbox` |
| 4 — Widget | `apps/widget` |
| 5 — Tickets & Customers | `/tickets`, `/customers` |
| 6 — Knowledge & AI | `/knowledge` |
| 7 — Settings | `/settings/*` |
