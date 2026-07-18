"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCustomer, type Conversation, type Customer } from "@supportflow/api-client";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

type CustomerSidebarProps = {
  conversation: Conversation | null;
};

function formatAssignee(assigneeId: string | null | undefined, currentUserId: string | undefined) {
  if (!assigneeId) return "Unassigned";
  if (currentUserId && assigneeId === currentUserId) return "You";
  return assigneeId;
}

function formatSnooze(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function CustomerSidebar({ conversation }: CustomerSidebarProps) {
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    setCustomer(null);
    if (!conversation) return;
    void getCustomer(api, conversation.customerId)
      .then(setCustomer)
      .catch(() => setCustomer(null));
  }, [conversation]);

  if (!conversation) {
    return (
      <aside className="hidden h-full border-l border-line bg-white p-4 xl:block dark:border-charcoal-muted dark:bg-charcoal">
        <p className="text-sm text-ink-muted">Customer details appear when a thread is selected.</p>
      </aside>
    );
  }

  const snoozeLabel = formatSnooze(conversation.snoozedUntil);

  return (
    <aside className="hidden h-full overflow-y-auto border-l border-line bg-white p-4 xl:block dark:border-charcoal-muted dark:bg-charcoal">
      <h2 className="text-sm font-semibold text-charcoal dark:text-white">Customer</h2>
      <p className="mt-1 text-xs text-ink-muted">
        {customer?.name || customer?.email || customer?.username || "Customer profile"}
      </p>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Customer ID</dt>
          <dd className="mt-1 break-all font-medium text-ink dark:text-white">
            <Link href={`/customers/${conversation.customerId}`} className="text-brand hover:underline">
              View full profile
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Channel</dt>
          <dd className="mt-1 text-ink dark:text-ink-faint">{conversation.channel}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Status</dt>
          <dd className="mt-1 text-ink dark:text-ink-faint">{conversation.status}</dd>
        </div>
        {conversation.status === "Snoozed" && snoozeLabel && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Snoozed until</dt>
            <dd className="mt-1 text-ink dark:text-ink-faint">{snoozeLabel}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Assignee</dt>
          <dd className="mt-1 break-all text-ink dark:text-ink-faint">
            {formatAssignee(conversation.assigneeId, user?.id)}
          </dd>
        </div>
        {conversation.tags.length > 0 && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Tags</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {conversation.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-line-soft px-2 py-0.5 text-xs text-ink-soft dark:bg-charcoal-soft"
                >
                  {tag}
                </span>
              ))}
            </dd>
          </div>
        )}
        {customer?.tags.length ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Customer tags</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {customer.tags.map((tag) => (
                <span key={tag} className="rounded bg-line-soft px-2 py-0.5 text-xs text-ink-soft dark:bg-charcoal-soft">
                  {tag}
                </span>
              ))}
            </dd>
          </div>
        ) : null}
      </dl>

      <p className="mt-6 text-xs text-ink-muted">
        Use the thread header to claim, unassign, or change status.
      </p>
    </aside>
  );
}
