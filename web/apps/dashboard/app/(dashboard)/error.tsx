"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-charcoal dark:text-white">Something went wrong</h2>
      <p className="text-sm text-ink-muted">
        {error.message || "This page hit an unexpected error. You can try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Try again
      </button>
    </div>
  );
}
