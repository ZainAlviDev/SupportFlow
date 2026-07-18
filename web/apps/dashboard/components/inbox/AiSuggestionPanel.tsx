"use client";

import { useEffect, useId, useState } from "react";
import type { SuggestReplyResult } from "@supportflow/api-client";
import { Button } from "@supportflow/ui";

type AiSuggestionPanelProps = {
  loading: boolean;
  error: string | null;
  result: SuggestReplyResult | null;
  onAccept: (text: string) => void;
  onDismiss: () => void;
};

/** Panel shown above the composer with an editable AI-suggested reply and its sources. */
export function AiSuggestionPanel({
  loading,
  error,
  result,
  onAccept,
  onDismiss,
}: AiSuggestionPanelProps) {
  const fieldId = useId();
  const [text, setText] = useState("");
  const [showSources, setShowSources] = useState(false);

  useEffect(() => {
    setText(result?.suggestion ?? "");
    setShowSources(false);
  }, [result]);

  if (!loading && !error && !result) {
    return null;
  }

  return (
    <section
      aria-label="AI suggested reply"
      className="border-t border-brand-200 bg-brand-50/70 px-3 py-3 sm:px-4 dark:border-brand-500/30 dark:bg-brand-500/10"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
            <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
          </svg>
          AI suggested reply
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-1 text-ink-muted hover:bg-brand-100 hover:text-ink dark:hover:bg-brand-500/20"
          aria-label="Dismiss suggestion"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {loading && (
        <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" aria-hidden />
          Drafting a reply from your knowledge base…
        </p>
      )}

      {!loading && error && (
        <p className="mt-2 text-sm text-red-700 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && result && (
        <>
          <label htmlFor={fieldId} className="sr-only">
            Suggested reply text
          </label>
          <textarea
            id={fieldId}
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={4}
            className="mt-2 w-full resize-y rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-brand-500/30 dark:bg-charcoal dark:text-white"
          />

          {result.sources.length > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowSources((prev) => !prev)}
                className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
                aria-expanded={showSources}
              >
                {showSources ? "Hide sources" : `Sources (${result.sources.length})`}
              </button>
              {showSources && (
                <ul className="mt-1.5 space-y-1.5">
                  {result.sources.map((source, index) => (
                    <li
                      key={`${source.articleId}-${index}`}
                      className="rounded-lg border border-brand-200/70 bg-white px-2.5 py-1.5 text-xs dark:border-brand-500/20 dark:bg-charcoal"
                    >
                      <span className="font-medium text-charcoal dark:text-white">
                        {source.articleTitle}
                      </span>
                      <p className="mt-0.5 line-clamp-2 text-ink-muted">{source.excerpt}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-2.5 flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!text.trim()}
              onClick={() => onAccept(text.trim())}
            >
              Use reply
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
