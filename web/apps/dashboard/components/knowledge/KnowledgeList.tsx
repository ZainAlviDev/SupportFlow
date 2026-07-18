"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  deleteKnowledgeArticle,
  listKnowledgeArticles,
  type KnowledgeArticle,
  type KnowledgeArticleStatus,
} from "@supportflow/api-client";
import { Button, Dialog, Input } from "@supportflow/ui";
import { api } from "@/lib/api";

const STATUS_FILTERS: Array<{ value: "" | KnowledgeArticleStatus; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "Draft", label: "Draft" },
  { value: "Published", label: "Published" },
];

function formatWhen(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

/** Plain-text preview of stored article content (may contain editor HTML). */
function contentPreview(content: string, maxLength = 140) {
  const text = content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Published"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
      : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{status}</span>
  );
}

export function KnowledgeList() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | KnowledgeArticleStatus>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<KnowledgeArticle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await listKnowledgeArticles(api, {
        search: query || undefined,
        status: status || undefined,
        page: 1,
        pageSize: 50,
      });
      setArticles(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load articles.");
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteKnowledgeArticle(api, pendingDelete.id);
      setArticles((prev) => prev.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete the article.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-charcoal dark:text-white">Knowledge Base</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Articles that power AI answers and help your team reply faster.
          </p>
        </div>
        <Link href="/knowledge/new">
          <Button type="button" size="sm">
            New article
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex min-w-0 flex-1 gap-2 sm:max-w-md"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(search.trim());
          }}
        >
          <Input
            aria-label="Search articles"
            placeholder="Search title or content"
            className="h-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button type="submit" size="sm" variant="outline">
            Search
          </Button>
        </form>

        <label className="sr-only" htmlFor="knowledge-status-filter">
          Status
        </label>
        <select
          id="knowledge-status-filter"
          className="h-9 rounded-lg border border-line bg-white px-3 text-sm text-ink dark:border-charcoal-muted dark:bg-charcoal dark:text-white"
          value={status}
          onChange={(event) => setStatus(event.target.value as "" | KnowledgeArticleStatus)}
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-white dark:border-charcoal-muted dark:bg-charcoal">
        {isLoading ? (
          <p className="px-4 py-8 text-sm text-ink-muted">Loading articles…</p>
        ) : articles.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-charcoal dark:text-white">
              {query || status ? "No articles match your filters." : "No articles yet."}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {query || status
                ? "Try a different search or status."
                : "Create your first article so the AI assistant can use it in replies."}
            </p>
            {!query && !status && (
              <Link href="/knowledge/new" className="mt-4 inline-block">
                <Button type="button" size="sm" variant="outline">
                  Create article
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-ink-muted dark:border-charcoal-muted">
                    <th className="px-4 py-3 font-medium">Article</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Chunks</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                    <th className="px-4 py-3 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr
                      key={article.id}
                      className="border-b border-line/70 last:border-0 hover:bg-muted/60 dark:border-charcoal-muted/70 dark:hover:bg-charcoal-soft"
                    >
                      <td className="max-w-sm px-4 py-3">
                        <Link
                          href={`/knowledge/${article.id}`}
                          className="font-medium text-brand hover:underline"
                        >
                          {article.title}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-ink-muted">
                          {contentPreview(article.content, 90)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-ink dark:text-ink-faint">
                        {article.category || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={article.status} />
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{article.chunkCount}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                        {formatWhen(article.updatedAt || article.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setPendingDelete(article)}
                          className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-line/70 md:hidden dark:divide-charcoal-muted/70">
              {articles.map((article) => (
                <li key={article.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/knowledge/${article.id}`}
                      className="min-w-0 font-medium text-brand hover:underline"
                    >
                      {article.title}
                    </Link>
                    <StatusBadge status={article.status} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                    {contentPreview(article.content)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                    {article.category && <span>{article.category}</span>}
                    <span>
                      {article.chunkCount} chunk{article.chunkCount === 1 ? "" : "s"}
                    </span>
                    <span>{formatWhen(article.updatedAt || article.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(article)}
                      className="ml-auto font-medium text-red-600 hover:underline dark:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <Dialog
        open={pendingDelete !== null}
        title="Delete article?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" will be removed permanently, including its search chunks. The AI assistant will stop using it.`
            : ""
        }
        primaryLabel={isDeleting ? "Deleting…" : "Delete"}
        secondaryLabel="Cancel"
        primaryVariant="primary"
        busy={isDeleting}
        onPrimary={() => void confirmDelete()}
        onSecondary={() => setPendingDelete(null)}
      />
    </div>
  );
}
