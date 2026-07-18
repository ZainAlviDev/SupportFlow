"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listCustomers, type Customer } from "@supportflow/api-client";
import { Button, Input } from "@supportflow/ui";
import { api } from "@/lib/api";

function formatWhen(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(value));
}

export function CustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCustomers(await listCustomers(api, { search: query || undefined, pageSize: 100 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold text-charcoal dark:text-white">Customers</h1>
        <p className="mt-1 text-sm text-ink-muted">Profiles, tags, notes, and support history.</p>
      </div>

      <form
        className="flex max-w-xl gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(search.trim());
        }}
      >
        <Input
          aria-label="Search customers"
          placeholder="Search name, email, or username"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button type="submit" size="sm">Search</Button>
      </form>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-line bg-white dark:border-charcoal-muted dark:bg-charcoal">
        {loading ? (
          <p className="p-6 text-sm text-ink-muted">Loading customers…</p>
        ) : customers.length === 0 ? (
          <p className="p-6 text-sm text-ink-muted">No customers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-ink-muted dark:border-charcoal-muted">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Username</th>
                  <th className="px-4 py-3 font-medium">Tags</th>
                  <th className="px-4 py-3 font-medium">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-line/70 last:border-0 dark:border-charcoal-muted/70">
                    <td className="px-4 py-3">
                      <Link href={`/customers/${customer.id}`} className="font-medium text-brand hover:underline">
                        {customer.name || customer.email || "Anonymous customer"}
                      </Link>
                      {customer.email && <div className="text-xs text-ink-muted">{customer.email}</div>}
                    </td>
                    <td className="px-4 py-3 text-ink dark:text-ink-faint">{customer.username || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {customer.tags.length ? customer.tags.map((tag) => (
                          <span key={tag} className="rounded bg-line-soft px-2 py-0.5 text-xs text-ink-soft dark:bg-charcoal-soft">{tag}</span>
                        )) : <span className="text-ink-muted">—</span>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{formatWhen(customer.lastSeenAt)}</td>
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
