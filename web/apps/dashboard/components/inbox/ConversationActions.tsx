"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  assignConversation,
  changeConversationStatus,
  createTicket,
  unassignConversation,
  type Conversation,
} from "@supportflow/api-client";
import { Button } from "@supportflow/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const STATUSES = ["Open", "Pending", "Resolved", "Snoozed"] as const;

type ConversationActionsProps = {
  conversation: Conversation;
  subjectHint?: string;
  onUpdated: (conversation: Conversation) => void;
};

function snoozeIso(hoursFromNow: number) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

function formatAssignee(assigneeId: string | null | undefined, currentUserId: string | undefined) {
  if (!assigneeId) return "Unassigned";
  if (currentUserId && assigneeId === currentUserId) return "You";
  return `${assigneeId.slice(0, 8)}…`;
}

function ticketSubjectFromHint(hint: string | undefined, conversationId: string) {
  const trimmed = hint?.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return `Conversation ${conversationId.slice(0, 8)}`;
  }
  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}…` : trimmed;
}

export function ConversationActions({
  conversation,
  subjectHint,
  onUpdated,
}: ConversationActionsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snoozeHours, setSnoozeHours] = useState("1");

  const isMine = Boolean(user?.id && conversation.assigneeId === user.id);
  const isUnassigned = !conversation.assigneeId;

  const run = async (action: () => Promise<Conversation>) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await action();
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update conversation.");
    } finally {
      setBusy(false);
    }
  };

  const onCreateTicket = async () => {
    setBusy(true);
    setError(null);
    try {
      const ticket = await createTicket(api, {
        customerId: conversation.customerId,
        conversationId: conversation.id,
        subject: ticketSubjectFromHint(subjectHint, conversation.id),
        description: subjectHint?.trim() || undefined,
        assigneeId: user?.id,
        priority: "Medium",
      });
      router.push(`/tickets/${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create ticket.");
      setBusy(false);
    }
  };

  const onStatusChange = async (status: string) => {
    if (status === conversation.status && status !== "Snoozed") return;

    if (status === "Snoozed") {
      const hours = Number(snoozeHours);
      if (!Number.isFinite(hours) || hours <= 0) {
        setError("Pick a valid snooze duration.");
        return;
      }
      await run(() =>
        changeConversationStatus(api, conversation.id, {
          status: "Snoozed",
          snoozedUntil: snoozeIso(hours),
        }),
      );
      return;
    }

    await run(() => changeConversationStatus(api, conversation.id, { status }));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`status-${conversation.id}`}>
          Status
        </label>
        <select
          id={`status-${conversation.id}`}
          className="h-8 rounded-lg border border-line bg-white px-2 text-xs font-medium text-ink dark:border-charcoal-muted dark:bg-charcoal-soft dark:text-white"
          value={conversation.status || "Open"}
          disabled={busy}
          onChange={(e) => void onStatusChange(e.target.value)}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          aria-label="Snooze duration"
          className="h-8 rounded-lg border border-line bg-white px-2 text-xs text-ink dark:border-charcoal-muted dark:bg-charcoal-soft dark:text-white"
          value={snoozeHours}
          disabled={busy}
          onChange={(e) => setSnoozeHours(e.target.value)}
          title="Used when setting status to Snoozed"
        >
          <option value="1">Snooze 1h</option>
          <option value="4">Snooze 4h</option>
          <option value="24">Snooze 1d</option>
        </select>

        {isUnassigned || !isMine ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void run(() => assignConversation(api, conversation.id))}
          >
            {isUnassigned ? "Claim" : "Reassign to me"}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => void run(() => unassignConversation(api, conversation.id))}
          >
            Unassign
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void onCreateTicket()}
        >
          Create ticket
        </Button>
      </div>

      <p className="text-left text-[11px] text-ink-muted">
        Assignee:{" "}
        <span className="font-medium text-ink-soft dark:text-ink-faint">
          {formatAssignee(conversation.assigneeId, user?.id)}
        </span>
        {conversation.status === "Snoozed" && conversation.snoozedUntil ? (
          <>
            {" "}
            · Until{" "}
            {new Intl.DateTimeFormat(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(conversation.snoozedUntil))}
          </>
        ) : null}
      </p>

      {error && <p className="max-w-md text-xs text-red-600">{error}</p>}
    </div>
  );
}
