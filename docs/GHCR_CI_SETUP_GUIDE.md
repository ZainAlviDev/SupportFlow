# SupportFlow — Docker & GHCR CI/CD Setup Guide

**Repository:** `https://github.com/merium6/SupportFlow`  
**Version:** 1.0 · July 2026  
**Team:** TechHub · Zain Ali · Maryam Ali

---

## 1. Overview (Yeh system kya karta hai?)

SupportFlow ke **9 microservices** (1 Gateway + 8 APIs) ke Docker images automatically build hote hain aur **GitHub Container Registry (GHCR)** par push hote hain.

**Registry path format:**

```
ghcr.io/merium6/supportflow/<service-name>:<tag>
```

**Example:**

```
ghcr.io/merium6/supportflow/gateway:dev
ghcr.io/merium6/supportflow/identity:staging_env1
```

**Kab chalta hai:**

| Event | Workflow chalega? | Image tag |
|-------|-------------------|-----------|
| PR merge INTO `dev` | ✅ Haan | `:dev` |
| PR merge INTO `staging` | ✅ Haan | `:staging_env1` + `:staging_env2` |
| PR merge INTO `master` | ❌ Nahi | — |
| Direct push (bina PR) | ❌ Nahi | — |
| Manual run (Actions tab) | ✅ Haan | branch ke hisaab se |

---

## 2. Branch Flow (Kaun si branch kahan jati hai)

```
Zain_Dev / Maryam_Dev  (feature branches)
         │
         │  Pull Request + Merge
         ▼
        dev              → Docker images :dev tag
         │
         │  Pull Request + Merge
         ▼
      staging            → Docker images :staging_env1 + :staging_env2
```

**Note:** `master` branch ab CI/CD se linked nahi hai. Default branch GitHub par **`dev`** honi chahiye.

---

## 3. Kaun si files bani hain? (File list + description)

### 3.1 Dockerfiles (repo root par — 9 files)

Har file ek service ka Docker image banati hai (.NET 8, port 8080).

| File | Service | GHCR image name |
|------|---------|-----------------|
| `GatewayDockerfile` | YARP API Gateway | `gateway` |
| `IdentityDockerfile` | Auth / JWT | `identity` |
| `WorkspaceDockerfile` | Workspaces | `workspace` |
| `ConversationDockerfile` | Chat / widget | `conversation` |
| `TicketDockerfile` | Support tickets | `ticket` |
| `CustomerDockerfile` | Customers | `customer` |
| `KnowledgeDockerfile` | Knowledge base | `knowledge` |
| `AIDockerfile` | AI features | `ai` |
| `NotificationDockerfile` | Notifications | `notification` |

**Local test (ek service):**

```powershell
cd C:\Projects\SupportFlow
docker build -f GatewayDockerfile -t supportflow-gateway:local .
```

---

### 3.2 `.dockerignore`

Docker build ke waqt unnecessary files skip karta hai (`bin/`, `obj/`, `.git`, `node_modules`). Build **faster** aur image **chhoti** rehti hai.

---

### 3.3 `.github/workflows/build-and-push-images.yml`

**Main CI/CD workflow file.** GitHub Actions is file ko padhta hai aur automatically:

1. Branch detect karta hai
2. Code checkout karta hai
3. Image tags set karta hai
4. GHCR par login karta hai
5. Har service ke liye `docker build` + `docker push` karta hai (9 parallel jobs)

---

### 3.4 `CONFIG.md`

GitHub admin ke liye short setup checklist — permissions, GHCR packages, placeholders.

---

### 3.5 `docker-compose.staging.yml`

Staging server par **GHCR se images pull** karke saari services + Postgres/Redis/MailHog ek saath chalane ke liye.

```powershell
$env:GITHUB_ORG = "merium6"
$env:IMAGE_TAG = "staging_env1"
docker compose -f docker-compose.staging.yml pull
docker compose -f docker-compose.staging.yml up -d
```

---

### 3.6 `docker-compose.yml` (pehle se tha)

Sirf **local infrastructure**: PostgreSQL, Redis, MailHog. App containers is mein nahi hain.

---

## 4. GitHub Setup (Pehli baar — ek dafa karna hai)

### Step 4.1 — Actions permissions

1. Repo kholo: `github.com/merium6/SupportFlow`
2. **Settings → Actions → General**
3. **Workflow permissions** → **Read and write permissions** select karo
4. **Save**

> Bina iske GHCR par push fail hoga (403 error).

---

### Step 4.2 — Default branch `dev` banao

1. **Settings → General → Default branch**
2. **`dev`** select karo → **Update**
3. Confirm karo

> Is se Actions tab mein workflow dikhega. `master` par merge ki zaroorat nahi.

---

### Step 4.3 — Branches confirm karo

Ye branches honi chahiye:

| Branch | Purpose |
|--------|---------|
| `dev` | Integration — yahan PR merge par `:dev` images |
| `staging` | QA — yahan PR merge par staging tags |
| `Zain_Dev` / `Maryam_Dev` | Feature work |

---

### Step 4.4 — GHCR packages (pehli successful run ke baad)

1. GitHub → **Packages**
2. Har package kholo (e.g. `supportflow/gateway`)
3. **Package settings → Connect repository** → SupportFlow link karo
4. Visibility set karo (Private recommended)

---

## 5. Workflow andar se kaise chalta hai? (Step-by-step)

Jab PR merge hota hai ya manual run karte ho:

```
Step 1: Detect branch
        → PR merge: base branch (dev ya staging)
        → Manual: aapki select ki hui branch

Step 2: Checkout code
        → Us branch ka latest code download

Step 3: Set image tags
        → dev branch     → tag "dev"
        → staging branch → tag "staging_env1" + alias "staging_env2"

Step 4: Login to GHCR
        → GITHUB_TOKEN use hota hai (automatic)

Step 5: Build + Push (9 jobs parallel)
        → gateway, identity, workspace, conversation,
          ticket, customer, knowledge, ai, notification
```

**Matrix jobs:** Ek workflow run mein **9 alag jobs** chalti hain — har service ke liye alag. Agar ek fail ho to baaki phir bhi chalti hain (`fail-fast: false`).

---

## 6. Manual run kaise karein? (Actions tab se)

Jab test karna ho bina PR merge ke:

1. Browser mein jao: `github.com/merium6/SupportFlow`
2. **Actions** tab click karo
3. Left sidebar mein **"Build and Push Images"** select karo
4. Right side **"Run workflow"** button (dropdown)
5. **Branch to build from:** `dev` select karo (ya koi aur branch)
6. **Run workflow** green button dabao
7. Neeche run list mein naya run dikhega — click karke 9 jobs dekho
8. Har job green ✅ honi chahiye

**Expected time:** 10–20 minutes (9 services × Docker build)

**Success ke baad check karo:**

- GitHub → **Packages** → `supportflow/gateway` etc. dikhna chahiye
- Tag `:dev` (ya jo branch select ki thi)

---

## 7. PR merge par automatic run kaise hota hai?

### Example A — Feature → dev

1. `Zain_Dev` par kaam karo, commit + push karo
2. GitHub → **Pull requests → New pull request**
3. **Base: `dev`** ← **Compare: `Zain_Dev`**
4. PR create karo, review karo
5. **Merge pull request** dabao
6. Automatically **Actions** tab mein naya run start hoga
7. Images push hongi: `ghcr.io/merium6/supportflow/*:dev`

### Example B — dev → staging

1. **Pull requests → New**
2. **Base: `staging`** ← **Compare: `dev`**
3. Merge karo
4. Workflow chalega — tags: `:staging_env1` aur `:staging_env2`

### Kya trigger NAHI karta?

| Action | Result |
|--------|--------|
| `dev` → `master` PR merge | ❌ Workflow nahi chalega |
| PR close bina merge | ❌ Nahi chalega |
| Direct push to `dev` | ❌ Nahi chalega (PR merge chahiye) |

---

## 8. Staging server par deploy

Jab staging images ready hon:

```powershell
# Server par
export GITHUB_ORG=merium6
export IMAGE_TAG=staging_env1

docker compose -f docker-compose.staging.yml pull
docker compose -f docker-compose.staging.yml up -d
```

**Gateway URL:** `http://<server-ip>:5000/health`

---

## 9. Local development (Docker ke saath)

### Sirf infrastructure (Postgres, Redis, MailHog):

```powershell
cd C:\Projects\SupportFlow
.\scripts\docker-up.ps1
.\scripts\redis-seed-config.ps1
```

### .NET services (containers ke bina):

```powershell
dotnet build
.\scripts\run-all.ps1
```

### Ek service container mein test:

```powershell
docker build -f GatewayDockerfile -t supportflow-gateway:local .
docker run -p 5000:8080 supportflow-gateway:local
```

---

## 10. Troubleshooting

| Problem | Solution |
|---------|----------|
| Actions tab khali / "Get started" | Default branch `dev` banao; workflow `dev` par hona chahiye |
| 403 push to GHCR | Settings → Actions → Read and write permissions enable karo |
| Workflow skip ho gaya | PR sirf close hua? Merge hona chahiye. Base branch `dev` ya `staging` honi chahiye |
| dev→master merge par run nahi | Expected — sirf dev/staging par trigger hota hai |
| Package nahi dikh raha | Pehli successful run ke baad Packages tab check karo |
| Docker build fail (.NET) | `dotnet build` locally chalao — compile errors fix karo |
| Branch name case | `dev` ≠ `Dev` — lowercase use karo |

---

## 11. Repo values (replace if needed)

| Setting | Current value |
|---------|---------------|
| GitHub Org | `merium6` |
| Image repo name | `supportflow` |
| Registry | `ghcr.io` |
| Trigger branches | `dev`, `staging` |
| Staging tags | `staging_env1`, `staging_env2` |

---

## 12. Quick checklist

- [ ] Actions Read and write permissions enabled
- [ ] Default branch = `dev`
- [ ] Workflow file on `dev` and `staging` branches
- [ ] Manual workflow run successful (test)
- [ ] PR merge to `dev` triggers workflow
- [ ] GHCR packages linked to repo
- [ ] Staging deploy tested with `docker-compose.staging.yml`

---

## 13. Future — Worker add karna

Jab `SupportFlow.Worker` project banega:

1. `WorkerDockerfile` create karo
2. Workflow matrix mein `worker` entry add karo
3. `docker-compose.staging.yml` mein worker service add karo

---

**Document:** SupportFlow GHCR CI/CD Setup Guide v1.0  
**Author:** TechHub Development Team  
**Last updated:** July 2026
