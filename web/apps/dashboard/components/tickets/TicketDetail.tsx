"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createTicketComment,
  getTicket,
  listTicketComments,
  updateTicket,
  type Ticket,
  type TicketComment,
} from "@supportflow/api-client";
import { Button, Input, Label } from "@supportflow/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const STATUSES = ["New", "Open", "Pending", "Resolved", "Closed"] as const;
const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

type TicketDetailProps = {
  ticketId: string;
};

function formatWhen(value: string) {
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

export function TicketDetail({ ticketId }: TicketDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ticketResult, commentsResult] = await Promise.all([
        getTicket(api, ticketId),
        listTicketComments(api, ticketId, true),
      ]);
      setTicket(ticketResult);
      setComments(commentsResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load ticket.");
      setTicket(null);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchTicket = async (payload: Parameters<typeof updateTicket>[2]) => {
    if (!ticket) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateTicket(api, ticket.id, payload);
      setTicket(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update ticket.");
    } finally {
      setBusy(false);
    }
  };

  const onAddComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ticket || !commentBody.trim()) return;

    setBusy(true);
    setError(null);
    try {
      const created = await createTicketComment(api, ticket.id, {
        body: commentBody.trim(),
        isInternal,
      });
      setComments((prev) => [...prev, created]);
      setCommentBody("");
      setIsInternal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add comment.");
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return <p className="p-6 text-sm text-ink-muted">Loading ticket…</p>;
  }

  if (!ticket) {
    return (
      <div className="space-y-3 p-6">
        <p className="text-sm text-red-600">{error || "Ticket not found."}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => router.push("/tickets")}>
          Back to tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div>
          <Link href="/tickets" className="text-xs font-medium text-brand hover:underline">
            ← All tickets
          </Link>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <h1 className="text-xl font-semibold text-charcoal dark:text-white">{ticket.subject}</h1>
            <span className="text-sm text-ink-muted">{ticket.ticketNumber}</span>
          </div>
          {ticket.description ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft dark:text-ink-faint">
              {ticket.description}
            </p>
          ) : null}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-xl border border-line bg-white p-4 dark:border-charcoal-muted dark:bg-charcoal">
          <h2 className="text-sm font-semibold text-charcoal dark:text-white">Comments</h2>
          <div className="mt-4 space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-ink-muted">No comments yet.</p>
            ) : (
              comments.map((comment) => (
                <article
                  key={comment.id}
                  className={`rounded-lg border px-3 py-2 ${
                    comment.isInternal
                      ? "border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20"
                      : "border-line bg-muted/40 dark:border-charcoal-muted dark:bg-charcoal-soft"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
                    <span className="font-medium text-ink-soft dark:text-ink-faint">
                      {user?.id === comment.authorId ? "You" : `${comment.authorId.slice(0, 8)}…`}
                    </span>
                    <span>·</span>
                    <span>{formatWhen(comment.createdAt)}</span>
                    {comment.isInternal ? (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-900 dark:bg-amber-900/50 dark:text-amber-100">
                        Internal
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink dark:text-white">{comment.body}</p>
                </article>
              ))
            )}
          </div>

          <form onSubmit={(e) => void onAddComment(e)} className="mt-4 space-y-3 border-t border-line pt-4 dark:border-charcoal-muted">
            <div>
              <Label htmlFor="ticket-comment">Add comment</Label>
              <textarea
                id="ticket-comment"
                className="mt-1 min-h-[88px] w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand dark:border-charcoal-muted dark:bg-charcoal-soft dark:text-white"
                value={commentBody}
                disabled={busy}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write an update…"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={isInternal}
                  disabled={busy}
                  onChange={(e) => setIsInternal(e.target.checked)}
                />
                Internal note (agents only)
              </label>
              <Button type="submit" size="sm" disabled={busy || !commentBody.trim()}>
                Post comment
              </Button>
            </div>
          </form>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border border-line bg-white p-4 dark:border-charcoal-muted dark:bg-charcoal">
          <h2 className="text-sm font-semibold text-charcoal dark:text-white">Details</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Status</dt>
              <dd className="mt-1">
                <select
                  className="h-9 w-full rounded-lg border border-line bg-white px-2 text-sm dark:border-charcoal-muted dark:bg-charcoal-soft dark:text-white"
                  value={ticket.status}
                  disabled={busy}
                  onChange={(e) => void patchTicket({ status: e.target.value })}
                >
                  {STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Priority</dt>
              <dd className="mt-1">
                <select
                  className="h-9 w-full rounded-lg border border-line bg-white px-2 text-sm dark:border-charcoal-muted dark:bg-charcoal-soft dark:text-white"
                  value={ticket.priority}
                  disabled={busy}
                  onChange={(e) => void patchTicket({ priority: e.target.value })}
                >
                  {PRIORITIES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Assignee</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void patchTicket({ assigneeId: user?.id })}
                >
                  Assign to me
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy || !ticket.assigneeId}
                  onClick={() => void patchTicket({ clearAssignee: true })}
                >
                  Unassign
                </Button>
              </dd>
              <p className="mt-1 text-xs text-ink-muted">
                {ticket.assigneeId
                  ? user?.id === ticket.assigneeId
                    ? "You"
                    : `${ticket.assigneeId.slice(0, 8)}…`
                  : "Unassigned"}
              </p>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Customer</dt>
              <dd className="mt-1 break-all">
                <Link href={`/customers/${ticket.customerId}`} className="text-brand hover:underline">
                  View customer profile
                </Link>
              </dd>
            </div>
            {ticket.conversationId ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Conversation</dt>
                <dd className="mt-1">
                  <Link href="/inbox" className="text-brand hover:underline">
                    Open inbox
                  </Link>
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Created</dt>
              <dd className="mt-1 text-ink-muted">{formatWhen(ticket.createdAt)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-line bg-white p-4 dark:border-charcoal-muted dark:bg-charcoal">
          <Label htmlFor="ticket-subject-edit">Subject</Label>
          <Input
            id="ticket-subject-edit"
            className="mt-1"
            defaultValue={ticket.subject}
            disabled={busy}
            onBlur={(e) => {
              const next = e.target.value.trim();
              if (next && next !== ticket.subject) {
                void patchTicket({ subject: next });
              }
            }}
          />
        </div>
      </aside>
    </div>
  );
}
