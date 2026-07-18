import Link from "next/link";
import type { Conversation, Ticket } from "@supportflow/api-client";

type TimelineItem = {
  id: string;
  kind: "Conversation" | "Ticket";
  title: string;
  status: string;
  date: string;
  href: string;
};

export function CustomerTimeline({
  conversations,
  tickets,
}: {
  conversations: Conversation[];
  tickets: Ticket[];
}) {
  const items: TimelineItem[] = [
    ...conversations.map((item) => ({
      id: item.id,
      kind: "Conversation" as const,
      title: `${item.channel} conversation`,
      status: item.status,
      date: item.lastMessageAt || item.createdAt,
      href: "/inbox",
    })),
    ...tickets.map((item) => ({
      id: item.id,
      kind: "Ticket" as const,
      title: `${item.ticketNumber} · ${item.subject}`,
      status: item.status,
      date: item.updatedAt || item.createdAt,
      href: `/tickets/${item.id}`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!items.length) {
    return <p className="text-sm text-ink-muted">No conversations or tickets yet.</p>;
  }

  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={`${item.kind}-${item.id}`} className="border-l-2 border-line pl-3 dark:border-charcoal-muted">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <span>{item.kind}</span><span>·</span><span>{item.status}</span><span>·</span>
            <time>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.date))}</time>
          </div>
          <Link href={item.href} className="mt-1 block text-sm font-medium text-brand hover:underline">
            {item.title}
          </Link>
        </li>
      ))}
    </ol>
  );
}
