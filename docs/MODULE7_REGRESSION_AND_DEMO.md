# Module 7 — Regression & Client Demo Checklist

Use this during Week 8 MVP release prep. Check each box as you go. Log failures in the Bug Log at the bottom.

## Prerequisites

- [ ] SQL Server Express running (`.\SQLEXPRESS`)
- [ ] Redis running (`localhost:6379`) if Conversation presence is enabled
- [ ] MailHog running (invite emails)
- [ ] Visual Studio **Full Backend Stack** profile: all 9 services, Debug Target **`http`** (not IIS Express)
- [ ] Dashboard: `http://localhost:3000`
- [ ] Widget script: `http://localhost:4173` (or configured `NEXT_PUBLIC_WIDGET_SCRIPT_URL`)
- [ ] Gateway health: `http://localhost:5000`

| Port | Service |
|------|---------|
| 5000 | Gateway |
| 5010 | Identity |
| 5020 | Workspace |
| 5030 | Conversation |
| 5040 | Ticket |
| 5050 | Customer |
| 5060 | Knowledge |
| 5070 | AI |
| 5080 | Notification |

---

## A. Client demo script (show this live)

| # | Step | Pass |
|---|------|------|
| 1 | Register a business account and create workspace **Acme Corp** | [ ] |
| 2 | Invite an agent; confirm email in MailHog; accept invite | [ ] |
| 3 | Create a widget API key; paste embed snippet on a test page; send a customer message | [ ] |
| 4 | Reply from the agent inbox in real time (second browser / window) | [ ] |
| 5 | Assign the conversation to the agent; resolve it | [ ] |
| 6 | Create a ticket from the conversation | [ ] |
| 7 | Publish a knowledge article titled **Return Policy** | [ ] |
| 8 | Open inbox → **Suggest reply**; show grounded suggestion + sources; accept/edit/send | [ ] |
| 9 | Open customer profile; show notes / timeline / history | [ ] |
| 10 | Update widget branding (color, position, welcome message); reload widget and show change | [ ] |
| 11 | Show business hours on **Settings → Workspace** | [ ] |
| 12 | Assign a conversation/ticket and show the **notification bell** update + mark as read | [ ] |

---

## B. Full regression (Modules 1–7)

### Auth & workspace
- [ ] Register / login / logout
- [ ] Session expiry shows modal (not a silent hard redirect only)
- [ ] Create workspace; rename workspace (Owner/Admin)
- [ ] Invite member; accept invite; role visible in team list

### Inbox & realtime
- [ ] Conversation list loads; empty and error/retry states work
- [ ] Open thread; send agent message; receive customer message live
- [ ] Assign / unassign / status change
- [ ] Typing indicator (if enabled)

### Widget
- [ ] Config loads branding from workspace settings
- [ ] Visitor can start/resume conversation
- [ ] Messages appear in agent inbox
- [ ] Invalid API key is rejected

### Tickets & customers
- [ ] Ticket list/detail; comments; create-from-inbox
- [ ] Customer list/detail; notes; tags/metadata if present
- [ ] Loading / empty / error states on both screens

### Knowledge & AI
- [ ] Article create/edit/publish/delete
- [ ] Suggest reply returns sources from published articles
- [ ] AI-generated message indicator visible after accept

### Notifications & settings (Module 7)
- [ ] Notification list + unread badge
- [ ] Realtime `NotificationReceived` while dashboard is open
- [ ] Mark one / mark all read persists after refresh
- [ ] Widget branding save does not wipe business hours (and reverse)
- [ ] Non-Owner/Admin cannot save workspace/widget settings

### Tenant isolation (spot checks)
- [ ] Tenant A cannot open Tenant B conversation/ticket/customer/article URLs (expect 404)
- [ ] Widget API key for Tenant A cannot talk to Tenant B data
- [ ] Notification for user A never appears for user B in the same tenant

---

## C. Bug log

| ID | Area | Severity | Repro | Fix / status |
|----|------|----------|-------|--------------|
| 1 | | P1/P2/P3 | | |
| 2 | | | | |

---

## D. Demo day notes

- Sample article body: clear return window, RMA steps, contact channel.
- Keep two browsers ready: agent dashboard + widget host page.
- Pre-create Acme Corp + agent invite if live registration is slow.
- If Azure OpenAI keys are missing, AI still works with development fallback — call that out once, then move on.
