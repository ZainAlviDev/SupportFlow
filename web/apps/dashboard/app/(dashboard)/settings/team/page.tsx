"use client";

import { useCallback, useEffect, useState } from "react";
import { listMembers, type WorkspaceMember } from "@supportflow/api-client";
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
    return <div className="text-sm text-ink-muted">Loading team...</div>;
  }

  return (
    <div>
      <p className="mb-4 text-sm text-ink-muted">
        Invite agents and manage who can access this workspace.
      </p>

      {error && (
        <div className="mb-4 max-w-4xl rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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

      <div className="grid max-w-4xl gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
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
