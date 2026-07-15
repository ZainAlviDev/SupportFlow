"use client";

import type { WorkspaceMember } from "@supportflow/api-client";
import { Card, CardContent } from "@supportflow/ui";

type TeamMembersListProps = {
  members: WorkspaceMember[];
};

export function TeamMembersList({ members }: TeamMembersListProps) {
  return (
    <Card className="dark:border-charcoal-muted dark:bg-charcoal">
      <CardContent className="py-6">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-charcoal dark:text-white">Members</h2>
          <span className="text-xs text-ink-muted">
            {members.length} {members.length === 1 ? "person" : "people"}
          </span>
        </div>
        <p className="mb-4 text-xs text-ink-muted">
          Everyone with access to this workspace, including pending invites.
        </p>

        {members.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No members loaded yet. If you just signed in, try Retry above or refresh the page.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-ink-muted dark:border-charcoal-muted">
                  <th className="pb-2 font-medium">Name / Email</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr
                    key={`${member.status}-${member.userId ?? member.inviteId ?? member.email}`}
                    className="border-b border-line/70 dark:border-charcoal-muted/70"
                  >
                    <td className="py-3">
                      <div className="font-medium text-charcoal dark:text-white">
                        {member.fullName || (member.status === "Pending" ? "Invited" : "—")}
                      </div>
                      <div className="text-ink-muted">{member.email}</div>
                    </td>
                    <td className="py-3 text-ink dark:text-ink-faint">{member.role}</td>
                    <td className="py-3">
                      <StatusBadge status={member.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Pending") {
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
        Pending
      </span>
    );
  }

  return (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
      {status || "Active"}
    </span>
  );
}
