# SupportFlow — GHCR & GitHub Actions Setup

Generic setup guide for a new GitHub org/account. Replace all placeholders before use.

---

## Repo-specific values to replace

| Placeholder | Example | Where used |
|-------------|---------|------------|
| `GITHUB_ORG` | `your-org` | GHCR image path, compose file |
| `IMAGE_REPO_NAME` | `supportflow` | Workflow `env.IMAGE_REPO_NAME`, compose |
| Branch `dev` | integration | Workflow triggers, tag `:dev` |
| Branch `staging` | QA | Workflow triggers, tags `:staging_env1`, `:staging_env2` |
| Staging tag aliases | `staging_env1`, `staging_env2` | Workflow tag mapping |

**Image path format:**

```
ghcr.io/<GITHUB_ORG>/<IMAGE_REPO_NAME>/<service-name>:<tag>
```

**Services built (9 images):**

| Image name | Dockerfile |
|------------|------------|
| `gateway` | `GatewayDockerfile` |
| `identity` | `IdentityDockerfile` |
| `workspace` | `WorkspaceDockerfile` |
| `conversation` | `ConversationDockerfile` |
| `ticket` | `TicketDockerfile` |
| `customer` | `CustomerDockerfile` |
| `knowledge` | `KnowledgeDockerfile` |
| `ai` | `AIDockerfile` |
| `notification` | `NotificationDockerfile` |

> **Worker:** `WorkerDockerfile` is not included yet — scaffold `SupportFlow.Worker` first, then add to the workflow matrix.

---

## A) Repository settings

1. Open **Settings → Actions → General**
2. Under **Workflow permissions**, select **Read and write permissions**
3. Enable **Allow GitHub Actions to create and approve pull requests** (if your org policy requires it)
4. Save

Without write permissions, `GITHUB_TOKEN` cannot push to GHCR.

---

## B) GHCR package visibility

After the first successful workflow run:

1. Go to **GitHub → Packages**
2. Open each package (e.g. `supportflow/gateway`)
3. **Package settings → Connect repository** → link this repo
4. Set visibility: **Private** or **Public**

---

## C) Secrets

| Secret | Required? | Purpose |
|--------|-----------|---------|
| `GITHUB_TOKEN` | Yes (automatic) | Push to `ghcr.io` when workflow permissions are correct |
| `GHCR_PAT` | Optional | Cross-org push; needs `write:packages` + `read:packages` (+ `repo` if private) |

Default setup uses only `GITHUB_TOKEN`. Use `GHCR_PAT` only if pushing to a different org/account.

---

## D) Branch protection (optional)

- Require PR before merge into `dev` and `staging`
- Workflow runs **after merge**, not on direct push
- Create branches on GitHub if missing:
  - `dev` — integration (may differ from local `DEV`; names are case-sensitive)
  - `staging` — QA / pre-production

**Deploy flow:**

| Event | Image tags pushed |
|-------|-------------------|
| PR merged to `dev` | `:dev` |
| PR merged to `staging` | `:staging_env1` and `:staging_env2` |
| Manual run (other branch) | `:<branch-name>` |

---

## E) Manual run

1. **Actions** tab → **Build and Push Images**
2. **Run workflow**
3. Select branch (default: `dev`)
4. Wait for all 9 matrix jobs to complete

---

## F) Deploy on server (staging)

```bash
# Set org before pull (or edit docker-compose.staging.yml)
export GITHUB_ORG=your-org
export IMAGE_TAG=staging_env1

docker compose -f docker-compose.staging.yml pull
docker compose -f docker-compose.staging.yml up -d
```

For dev environment, use `IMAGE_TAG=dev`.

---

## Local Docker build (test before CI)

From repo root:

```powershell
docker build -f GatewayDockerfile -t supportflow-gateway:local .
docker build -f IdentityDockerfile -t supportflow-identity:local .
# ... repeat for other services
```

Infrastructure only (no app containers):

```powershell
docker compose up -d
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 403 on push to GHCR | Enable workflow **Read and write** permissions |
| Package not visible | Link package to repo in Package settings |
| Workflow skipped on PR | PR must be **merged** (not just closed) into `dev` or `staging` |
| Wrong branch built | Check PR **base** branch or manual input |
