"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  createCustomerNote,
  getCustomer,
  listConversations,
  listCustomerNotes,
  listTickets,
  updateCustomer,
  type Conversation,
  type Customer,
  type CustomerNote,
  type Ticket,
} from "@supportflow/api-client";
import { Button, Input, Label } from "@supportflow/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { CustomerTimeline } from "./CustomerTimeline";

export function CustomerDetail({ customerId }: { customerId: string }) {
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tagsText, setTagsText] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profile, customerNotes, customerConversations, customerTickets] = await Promise.all([
        getCustomer(api, customerId),
        listCustomerNotes(api, customerId),
        listConversations(api, { customerId, pageSize: 100 }),
        listTickets(api, { customerId, pageSize: 100 }),
      ]);
      setCustomer(profile);
      setTagsText(profile.tags.join(", "));
      setNotes(customerNotes);
      setConversations(customerConversations);
      setTickets(customerTickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load customer profile.");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (payload: Parameters<typeof updateCustomer>[2]) => {
    if (!customer) return;
    setBusy(true);
    setError(null);
    try {
      setCustomer(await updateCustomer(api, customer.id, payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update customer.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="p-6 text-sm text-ink-muted">Loading customer…</p>;
  if (!customer) return <p className="p-6 text-sm text-red-600">{error || "Customer not found."}</p>;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div>
          <Link href="/customers" className="text-xs font-medium text-brand hover:underline">← All customers</Link>
          <h1 className="mt-2 text-xl font-semibold text-charcoal dark:text-white">
            {customer.name || customer.email || customer.username || "Anonymous customer"}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">Customer profile and complete support history.</p>
        </div>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <section className="rounded-xl border border-line bg-white p-4 dark:border-charcoal-muted dark:bg-charcoal">
          <h2 className="text-sm font-semibold text-charcoal dark:text-white">Timeline</h2>
          <div className="mt-4"><CustomerTimeline conversations={conversations} tickets={tickets} /></div>
        </section>

        <section className="rounded-xl border border-line bg-white p-4 dark:border-charcoal-muted dark:bg-charcoal">
          <h2 className="text-sm font-semibold text-charcoal dark:text-white">Internal notes</h2>
          <form
            className="mt-3 flex gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!noteBody.trim()) return;
              setBusy(true);
              try {
                const note = await createCustomerNote(api, customer.id, noteBody.trim());
                setNotes((current) => [note, ...current]);
                setNoteBody("");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to add note.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <Input value={noteBody} onChange={(event) => setNoteBody(event.target.value)} placeholder="Add an internal note" disabled={busy} />
            <Button type="submit" size="sm" disabled={busy || !noteBody.trim()}>Add</Button>
          </form>
          <div className="mt-4 space-y-3">
            {notes.length ? notes.map((note) => (
              <article key={note.id} className="rounded-lg bg-muted p-3 text-sm dark:bg-charcoal-soft">
                <p className="whitespace-pre-wrap text-ink dark:text-white">{note.body}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {user?.id === note.authorId ? "You" : `${note.authorId.slice(0, 8)}…`} ·{" "}
                  {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(note.createdAt))}
                </p>
              </article>
            )) : <p className="text-sm text-ink-muted">No notes yet.</p>}
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <section className="rounded-xl border border-line bg-white p-4 dark:border-charcoal-muted dark:bg-charcoal">
          <h2 className="text-sm font-semibold text-charcoal dark:text-white">Profile</h2>
          <div className="mt-4 space-y-3">
            {[
              ["Name", "name", customer.name || ""],
              ["Email", "email", customer.email || ""],
              ["Username", "username", customer.username || ""],
            ].map(([label, key, value]) => (
              <div key={key}>
                <Label htmlFor={`customer-${key}`}>{label}</Label>
                <Input
                  id={`customer-${key}`}
                  className="mt-1"
                  defaultValue={value}
                  disabled={busy}
                  onBlur={(event) => {
                    if (event.target.value !== value) void patch({ [key]: event.target.value });
                  }}
                />
              </div>
            ))}
            <div>
              <Label htmlFor="customer-tags">Tags</Label>
              <Input id="customer-tags" className="mt-1" value={tagsText} onChange={(event) => setTagsText(event.target.value)} disabled={busy} />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2"
                disabled={busy}
                onClick={() => void patch({ tags: tagsText.split(",").map((tag) => tag.trim()).filter(Boolean) })}
              >
                Save tags
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-white p-4 text-sm dark:border-charcoal-muted dark:bg-charcoal">
          <h2 className="font-semibold text-charcoal dark:text-white">Activity</h2>
          <dl className="mt-3 space-y-2 text-ink-muted">
            <div className="flex justify-between"><dt>Conversations</dt><dd>{conversations.length}</dd></div>
            <div className="flex justify-between"><dt>Tickets</dt><dd>{tickets.length}</dd></div>
            <div className="flex justify-between"><dt>First seen</dt><dd>{new Date(customer.firstSeenAt).toLocaleDateString()}</dd></div>
            <div className="flex justify-between"><dt>Last seen</dt><dd>{new Date(customer.lastSeenAt).toLocaleDateString()}</dd></div>
          </dl>
        </section>
      </aside>
    </div>
  );
}
