"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listCustomers, type Customer } from "@supportflow/api-client";
import { Button, Input } from "@supportflow/ui";
import { AiLoader } from "@/components/ui/AiLoader";
import { api } from "@/lib/api";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const AVATAR_TONES = [
  "from-brand-400 to-brand-600",
  "from-sky-400 to-sky-600",
  "from-violet-400 to-violet-600",
  "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600",
];

function toneFor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

function displayNameOf(customer: Customer) {
  if (customer.name && !UUID_RE.test(customer.name)) return customer.name;
  if (customer.email) return customer.email;
  return "Anonymous visitor";
}

function displayUsernameOf(customer: Customer) {
  if (!customer.username) return null;
  if (UUID_RE.test(customer.username)) return `visitor-${customer.username.slice(0, 8)}`;
  return customer.username;
}

function initialsOf(customer: Customer) {
  const name = displayNameOf(customer);
  if (name === "Anonymous visitor") return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function formatWhen(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
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
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/20">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-charcoal dark:text-white">
              Customers
            </h1>
            <p className="text-xs text-ink-muted">Profiles, tags, notes, and support history.</p>
          </div>
        </div>

        {!loading && (
          <span className="rounded-full bg-surface-soft px-3 py-1 text-xs font-medium text-ink-soft dark:bg-charcoal-muted dark:text-ink-faint">
            {customers.length} {customers.length === 1 ? "customer" : "customers"}
          </span>
        )}
      </div>

      <form
        className="flex max-w-xl gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(search.trim());
        }}
      >
        <div className="relative min-w-0 flex-1">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <Input
            aria-label="Search customers"
            placeholder="Search name, email, or username"
            className="pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button type="submit" size="sm" className="h-11 shrink-0 px-4">
          Search
        </Button>
      </form>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-line dark:bg-charcoal dark:ring-charcoal-muted">
        {loading ? (
          <div className="flex justify-center py-12">
            <AiLoader size="sm" label="Loading customers" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-soft text-ink-faint dark:bg-charcoal-muted">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <p className="mt-3 text-sm font-medium text-charcoal dark:text-white">
              No customers found
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              {query
                ? "Try a different name, email, or username."
                : "Customers appear here after their first conversation."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_120px_28px] gap-3 border-b border-line px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint sm:grid dark:border-charcoal-muted">
              <span>Customer</span>
              <span>Username</span>
              <span>Tags</span>
              <span>Last seen</span>
              <span />
            </div>

            <ul className="divide-y divide-line dark:divide-charcoal-muted">
              {customers.map((customer) => {
                const username = displayUsernameOf(customer);
                return (
                  <li key={customer.id}>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-brand-50/50 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_120px_28px] sm:gap-3 sm:px-5 dark:hover:bg-brand-500/5"
                    >
                      <div className="flex min-w-0 items-center gap-3 sm:contents">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${toneFor(customer.id)}`}
                          >
                            {initialsOf(customer)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-charcoal dark:text-white">
                              {displayNameOf(customer)}
                            </p>
                            {customer.email && (
                              <p className="truncate text-xs text-ink-muted">{customer.email}</p>
                            )}
                          </div>
                        </div>

                        <p className="hidden truncate font-mono text-xs text-ink-soft sm:block dark:text-ink-faint">
                          {username ? `@${username}` : "—"}
                        </p>

                        <div className="hidden flex-wrap gap-1 sm:flex">
                          {customer.tags.length > 0 ? (
                            customer.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-ink-faint">—</span>
                          )}
                          {customer.tags.length > 2 && (
                            <span className="text-[11px] text-ink-faint">
                              +{customer.tags.length - 2}
                            </span>
                          )}
                        </div>

                        <p className="hidden whitespace-nowrap text-xs text-ink-muted sm:block">
                          {formatWhen(customer.lastSeenAt)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1 sm:hidden">
                        <span className="text-[11px] text-ink-muted">
                          {formatWhen(customer.lastSeenAt)}
                        </span>
                      </div>

                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="justify-self-end text-ink-faint"
                        aria-hidden
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
