"use client";

import type { WorkspaceMember } from "@supportflow/api-client";

type TeamMembersListProps = {
  members: WorkspaceMember[];
};

function initialsOf(name: string | undefined | null, email: string) {
  const source = name?.trim() || email;
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

const AVATAR_TONES = [
  "from-brand-400 to-brand-600",
  "from-sky-400 to-sky-600",
  "from-violet-400 to-violet-600",
  "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600",
];

function toneFor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

export function TeamMembersList({ members }: TeamMembersListProps) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line dark:bg-charcoal dark:ring-charcoal-muted">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <div>
            <h2 className="text-sm font-semibold text-charcoal dark:text-white">Members</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Everyone with access to this workspace, including pending invites.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-surface-soft px-2.5 py-1 text-xs font-medium text-ink-soft dark:bg-charcoal-muted dark:text-ink-faint">
          {members.length} {members.length === 1 ? "person" : "people"}
        </span>
      </div>

      {members.length === 0 ? (
        <p className="mt-5 text-sm text-ink-muted">
          No members loaded yet. If you just signed in, try Retry above or refresh the page.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line dark:divide-charcoal-muted dark:border-charcoal-muted">
          {members.map((member) => {
            const key = `${member.status}-${member.userId ?? member.inviteId ?? member.email}`;
            const pending = member.status === "Pending";
            return (
              <li key={key} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${toneFor(member.email)}`}
                >
                  {initialsOf(member.fullName, member.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-charcoal dark:text-white">
                    {member.fullName || (pending ? "Invited" : "—")}
                  </p>
                  <p className="truncate text-xs text-ink-muted">{member.email}</p>
                </div>
                <span className="hidden shrink-0 rounded-md bg-surface-soft px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-soft sm:block dark:bg-charcoal-muted dark:text-ink-faint">
                  {member.role}
                </span>
                <StatusBadge status={member.status} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Pending") {
    return (
      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
        Pending
      </span>
    );
  }

  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
      {status || "Active"}
    </span>
  );
}
