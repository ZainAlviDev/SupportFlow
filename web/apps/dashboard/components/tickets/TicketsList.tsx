"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listTickets, type Ticket } from "@supportflow/api-client";
import { Button } from "@supportflow/ui";
import { AiLoader } from "@/components/ui/AiLoader";
import { api } from "@/lib/api";

const STATUSES = ["", "New", "Open", "Pending", "Resolved", "Closed"] as const;
const PRIORITIES = ["", "Low", "Medium", "High", "Urgent"] as const;
const ASSIGNEES = [
  { value: "", label: "All assignees" },
  { value: "me", label: "Assigned to me" },
  { value: "unassigned", label: "Unassigned" },
] as const;

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

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Resolved" || status === "Closed"
      ? "bg-emerald-50 text-emerald-800"
      : status === "Pending"
        ? "bg-amber-50 text-amber-800"
        : "bg-sky-50 text-sky-800";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{status}</span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const tone =
    priority === "Urgent"
      ? "text-red-700"
      : priority === "High"
        ? "text-orange-700"
        : "text-ink-muted";

  return <span className={`text-xs font-medium ${tone}`}>{priority}</span>;
}

export function TicketsList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignee, setAssignee] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await listTickets(api, {
        status: status || undefined,
        priority: priority || undefined,
        assignee: assignee || undefined,
        page: 1,
        pageSize: 50,
      });
      setTickets(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tickets.");
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [assignee, priority, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-charcoal dark:text-white">Tickets</h1>
          <p className="mt-1 text-sm text-ink-muted">Track and resolve support issues.</p>
        </div>
        <Button type="button" size="sm" variant="outline" disabled={isLoading} onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="ticket-status-filter">
          Status
        </label>
        <select
          id="ticket-status-filter"
          className="h-9 rounded-lg border border-line bg-white px-3 text-sm text-ink dark:border-charcoal-muted dark:bg-charcoal dark:text-white"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUSES.map((value) => (
            <option key={value || "all"} value={value}>
              {value ? value : "All statuses"}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="ticket-priority-filter">
          Priority
        </label>
        <select
          id="ticket-priority-filter"
          className="h-9 rounded-lg border border-line bg-white px-3 text-sm text-ink dark:border-charcoal-muted dark:bg-charcoal dark:text-white"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          {PRIORITIES.map((value) => (
            <option key={value || "all"} value={value}>
              {value ? value : "All priorities"}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="ticket-assignee-filter">
          Assignee
        </label>
        <select
          id="ticket-assignee-filter"
          className="h-9 rounded-lg border border-line bg-white px-3 text-sm text-ink dark:border-charcoal-muted dark:bg-charcoal dark:text-white"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
        >
          {ASSIGNEES.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            className="text-xs font-medium text-brand-700"
            onClick={() => void load()}
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-white dark:border-charcoal-muted dark:bg-charcoal">
        {isLoading ? (
          <div className="flex justify-center px-4 py-10">
            <AiLoader size="sm" label="Loading tickets" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-charcoal dark:text-white">No tickets yet</p>
            <p className="mt-1 text-sm text-ink-muted">
              Create one from a conversation in the inbox.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-ink-muted dark:border-charcoal-muted">
                  <th className="px-4 py-3 font-medium">Ticket</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-line/70 last:border-0 hover:bg-muted/60 dark:border-charcoal-muted/70 dark:hover:bg-charcoal-soft"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-medium text-brand hover:underline"
                      >
                        {ticket.ticketNumber}
                      </Link>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-ink dark:text-ink-faint">
                      <Link href={`/tickets/${ticket.id}`} className="hover:underline">
                        {ticket.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                      {formatWhen(ticket.updatedAt || ticket.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
