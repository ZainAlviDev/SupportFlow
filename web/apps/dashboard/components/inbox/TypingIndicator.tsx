"use client";

type TypingIndicatorProps = {
  names: string[];
};

function formatTypingLabel(names: string[]) {
  if (names.length === 0) return null;
  if (names.length === 1) return `${names[0]} is typing`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
  return `${names[0]} and ${names.length - 1} others are typing`;
}

export function TypingIndicator({ names }: TypingIndicatorProps) {
  const label = formatTypingLabel(names);
  if (!label) return null;

  return (
    <div
      className="flex items-center gap-2 text-xs text-ink-muted"
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-3 py-2 shadow-sm dark:bg-charcoal">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-faint" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-faint [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-faint [animation-delay:300ms]" />
      </span>
      <span className="italic">
        {label}
        <span className="tracking-wider">…</span>
      </span>
    </div>
  );
}
