"use client";

import { useState, type FormEvent } from "react";
import type { Conversation } from "@supportflow/api-client";
import { Button, Input, Label } from "@supportflow/ui";
import { useAuth } from "@/hooks/useAuth";
import {
  useInboxStore,
  type InboxAssigneeFilter,
  type InboxStatusFilter,
} from "@/stores/inboxStore";

type ConversationListProps = {
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (payload: {
    username: string;
    initialMessage?: string;
  }) => Promise<void>;
};

function formatRelative(value: string) {
  try {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
  } catch {
    return "";
  }
}

const STATUS_DOTS: Record<string, string> = {
  Open: "bg-sky-500",
  Pending: "bg-amber-500",
  Resolved: "bg-emerald-500",
  Snoozed: "bg-violet-500",
};

const STATUS_OPTIONS: { value: InboxStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Open", label: "Open" },
  { value: "Pending", label: "Pending" },
  { value: "Resolved", label: "Resolved" },
  { value: "Snoozed", label: "Snoozed" },
];

const ASSIGNEE_OPTIONS: { value: InboxAssigneeFilter; label: string }[] = [
  { value: "all", label: "Anyone" },
  { value: "me", label: "Mine" },
  { value: "unassigned", label: "Unassigned" },
];

export function ConversationList({
  conversations,
  isLoading,
  error,
  selectedId,
  onSelect,
  onCreate,
}: ConversationListProps) {
  const { user } = useAuth();
  const statusFilter = useInboxStore((s) => s.statusFilter);
  const assigneeFilter = useInboxStore((s) => s.assigneeFilter);
  const setStatusFilter = useInboxStore((s) => s.setStatusFilter);
  const setAssigneeFilter = useInboxStore((s) => s.setAssigneeFilter);

  const [showNew, setShowNew] = useState(false);
  const [username, setUsername] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const onSubmitNew = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setCreateError("Username is required.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      await onCreate({
        username: trimmedUsername,
        initialMessage: initialMessage.trim() || undefined,
      });
      setUsername("");
      setInitialMessage("");
      setShowNew(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Unable to create conversation.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-line bg-white dark:border-charcoal-muted dark:bg-charcoal">
      <div className="shrink-0 space-y-3 border-b border-line px-3 py-3 dark:border-charcoal-muted">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-charcoal dark:text-white">Inbox</h2>
          <Button type="button" size="sm" variant="outline" onClick={() => setShowNew((v) => !v)}>
            {showNew ? "Cancel" : "New"}
          </Button>
        </div>

        <div className="flex gap-2">
          <select
            className="h-9 w-full rounded-lg border border-line bg-white px-2 text-xs text-ink dark:border-charcoal-muted dark:bg-charcoal-soft dark:text-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InboxStatusFilter)}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="h-9 w-full rounded-lg border border-line bg-white px-2 text-xs text-ink dark:border-charcoal-muted dark:bg-charcoal-soft dark:text-white"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value as InboxAssigneeFilter)}
            aria-label="Filter by assignee"
          >
            {ASSIGNEE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {showNew && (
          <form onSubmit={onSubmitNew} className="space-y-2 rounded-lg border border-line p-2 dark:border-charcoal-muted">
            <div>
              <Label htmlFor="newCustomerUsername" className="text-xs">
                Customer username
              </Label>
              <Input
                id="newCustomerUsername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="jane_doe"
                required
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="newInitialMessage" className="text-xs">
                First message (optional)
              </Label>
              <Input
                id="newInitialMessage"
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Hello"
                className="h-9 text-xs"
              />
            </div>
            {createError && <p className="text-xs text-red-600">{createError}</p>}
            <Button type="submit" size="sm" className="w-full" disabled={creating}>
              {creating ? "Creating…" : "Start conversation"}
            </Button>
          </form>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading && (
          <p className="px-3 py-4 text-sm text-ink-muted">Loading conversations…</p>
        )}
        {error && (
          <div className="m-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        {!isLoading && conversations.length === 0 && (
          <p className="px-3 py-4 text-sm text-ink-muted">
            No conversations yet. Start one or wait for widget traffic.
          </p>
        )}
        <ul className="divide-y divide-line dark:divide-charcoal-muted">
          {conversations.map((conversation) => {
            const active = conversation.id === selectedId;
            const mine = Boolean(user?.id && conversation.assigneeId === user.id);
            const customerShort = conversation.customerId.slice(0, 8);
            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  aria-current={active ? "true" : undefined}
                  className={`relative w-full px-3 py-3 text-left transition-colors ${
                    active
                      ? "bg-brand-50 dark:bg-charcoal-muted"
                      : "hover:bg-surface-soft dark:hover:bg-charcoal-soft"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-y-0 left-0 w-0.5 bg-brand-500" aria-hidden />
                  )}
                  <div className="flex items-start gap-2.5">
                    <div className="relative shrink-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-line-soft text-xs font-bold uppercase text-ink-soft dark:bg-charcoal-soft dark:text-ink-faint">
                        {customerShort.slice(0, 2)}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-charcoal ${
                          STATUS_DOTS[conversation.status] ?? "bg-ink-faint"
                        }`}
                        title={conversation.status}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium text-charcoal dark:text-white">
                          Customer {customerShort}
                        </p>
                        <span className="shrink-0 text-[11px] text-ink-faint">
                          {formatRelative(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-muted">
                        {conversation.channel}
                        {!conversation.assigneeId ? (
                          <span className="text-amber-600 dark:text-amber-400"> · Unassigned</span>
                        ) : mine ? (
                          " · Mine"
                        ) : (
                          " · Assigned"
                        )}
                      </p>
                      {conversation.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {conversation.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded bg-line-soft px-1.5 py-0.5 text-[10px] text-ink-soft dark:bg-charcoal-soft dark:text-ink-faint"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
