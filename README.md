## SupportFlow — Microservices (Phase 1)

TechHub · AI Customer Support SaaS · .NET 8

### Architecture

```
                    SupportFlow.Gateway (:5000)
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼         ▼         ▼         ▼           ▼
   Identity   Workspace  Conversation  Ticket   ... (8 services)
   :5010      :5020       :5030       :5040
```

Each service uses **Clean Architecture**:

```
Service/
├── SupportFlow.{Service}.Api           ← Controllers, Program.cs
├── SupportFlow.{Service}.Application   ← MediatR, validators, use cases
├── SupportFlow.{Service}.Domain        ← Entities, interfaces
└── SupportFlow.{Service}.Infrastructure ← EF Core, external APIs
```

### Services & Ports

| Service | Port | Gateway route |
|---------|------|---------------|
| **Gateway** | 5000 | — |
| Identity | 5010 | `/api/v1/auth/*` |
| Workspace | 5020 | `/api/v1/workspaces/*` |
| Conversation | 5030 | `/api/v1/conversations/*`, `/api/v1/widget/*` |
| Ticket | 5040 | `/api/v1/tickets/*` |
| Customer | 5050 | `/api/v1/customers/*` |
| Knowledge | 5060 | `/api/v1/knowledge/*` |
| AI | 5070 | `/api/v1/ai/*` |
| Notification | 5080 | `/api/v1/notifications/*` |

### Health checks

| Endpoint | Description |
|----------|-------------|
| `GET http://localhost:5000/health` | Gateway — checks all services |
| `GET http://localhost:5010/health` | Identity (via MediatR) |
| `GET http://localhost:{port}/health/live` | ASP.NET liveness per service |

### Run locally

#### 1. Start Docker (Postgres + Redis + MailHog)

```powershell
cd C:\Projects\SupportFlow

# Start all containers
.\scripts\docker-up.ps1

# OR manually:
docker compose up -d

# Check status
docker compose ps

# Test Redis
docker exec supportflow-redis redis-cli ping
# Expected: PONG

# Seed dev config keys into Redis (JWT, DB template, etc.)
.\scripts\redis-seed-config.ps1

# Stop everything
.\scripts\docker-down.ps1
# OR: docker compose down
```

#### 2. Local URLs

| Service | URL / Connection |
|---------|------------------|
| PostgreSQL | `Host=localhost;Port=5432;Database=supportflow;Username=postgres;Password=postgres` |
| Redis | `localhost:6379` — appsettings: `"Valkey": { "Host": "localhost", "Port": 6379 }` |
| MailHog UI | http://localhost:8025 |

#### 3. Run .NET services

```powershell
# Build all
dotnet build

# Run gateway
dotnet run --project src/Gateway/SupportFlow.Gateway

# Run a service (example)
dotnet run --project src/Services/Identity/SupportFlow.Identity.Api

# Run all APIs (separate windows)
.\scripts\run-all.ps1
```

#### 4. EF migrations (without Redis)

```powershell
$env:SUPPORTFLOW_EF_CONNECTION = "Host=localhost;Port=5432;Database=supportflow;Username=postgres;Password=postgres"
dotnet ef migrations add Initial --project src/Services/Identity/SupportFlow.Identity.Infrastructure --startup-project src/Services/Identity/SupportFlow.Identity.Api
```

### Stack

- .NET 8, ASP.NET Core Web API
- **YARP** API Gateway
- **MediatR** + FluentValidation (every service)
- PostgreSQL, Redis (docker-compose — Module 0)
- Next.js dashboard (coming in `web/`)

### Team

Zain Ali · Maryam Ali · AI Developer — see `docs/DEVELOPER_PLAN_PHASE1.md`
