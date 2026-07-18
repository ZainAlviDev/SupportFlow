"use client";

import { useCallback, useEffect, useState } from "react";
import { listMembers, type WorkspaceMember } from "@supportflow/api-client";
import { AiLoader } from "@/components/ui/AiLoader";
import { InviteMemberForm } from "@/components/settings/InviteMemberForm";
import { TeamMembersList } from "@/components/settings/TeamMembersList";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { canManageWorkspace } from "@/lib/workspaceAccess";

export default function TeamSettingsPage() {
  const { workspace } = useAuth();
  const canInvite = canManageWorkspace(workspace?.role);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    const result = await listMembers(api);
    setMembers(result);
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        await loadMembers();
        if (active) setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load team members.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [loadMembers]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <AiLoader size="sm" label="Loading team" />
      </div>
    );
  }

  const activeCount = members.filter((m) => m.status !== "Pending").length;
  const pendingCount = members.filter((m) => m.status === "Pending").length;
  const adminCount = members.filter((m) => m.role === "Owner" || m.role === "Admin").length;

  const stats = [
    {
      label: "Active members",
      value: activeCount,
      icon: (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      ),
      tone: "text-brand-600 bg-brand-50 dark:text-brand-300 dark:bg-brand-500/15",
    },
    {
      label: "Pending invites",
      value: pendingCount,
      icon: (
        <>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </>
      ),
      tone: "text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/15",
    },
    {
      label: "Owners & admins",
      value: adminCount,
      icon: (
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      ),
      tone: "text-sky-600 bg-sky-50 dark:text-sky-300 dark:bg-sky-500/15",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Team stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line dark:bg-charcoal dark:ring-charcoal-muted"
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {stat.icon}
              </svg>
            </span>
            <div>
              <p className="text-lg font-bold leading-tight text-charcoal dark:text-white">
                {stat.value}
              </p>
              <p className="text-xs text-ink-muted">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
          <button
            type="button"
            className="ml-3 text-sm font-semibold underline"
            onClick={async () => {
              setLoading(true);
              try {
                await loadMembers();
                setError(null);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to load team members.");
              } finally {
                setLoading(false);
              }
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,24rem)_1fr]">
        {canInvite ? (
          <InviteMemberForm
            onInvited={async () => {
              setError(null);
              await loadMembers();
            }}
          />
        ) : (
          <div className="rounded-lg border border-line bg-white px-4 py-6 text-sm text-ink-muted dark:border-charcoal-muted dark:bg-charcoal">
            Only Owners and Admins can send invitations. You can still view the members list.
          </div>
        )}
        <TeamMembersList members={members} />
      </div>
    </div>
  );
}
