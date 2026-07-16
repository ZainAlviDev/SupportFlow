"use client";

import type { Message } from "@supportflow/api-client";

type MessageBubbleProps = {
  message: Message;
  /** When omitted, layout is inferred from senderType. */
  isOwn?: boolean;
};

function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function resolveLayout(message: Message, isOwn?: boolean) {
  if (typeof isOwn === "boolean") {
    return isOwn ? "own" : "other";
  }

  switch (message.senderType) {
    case "Agent":
    case "AI":
      return "own";
    case "System":
      return "system";
    default:
      return "other";
  }
}

function senderLabel(message: Message, layout: "own" | "other" | "system") {
  if (layout === "system") return "System";
  if (message.senderType === "Customer") return "Customer";
  if (message.senderType === "AI" || message.isAiGenerated) return "AI assistant";
  if (layout === "own") return "You";
  return message.senderType || "Agent";
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const layout = resolveLayout(message, isOwn);
  const label = senderLabel(message, layout);

  if (layout === "system") {
    return (
      <div className="flex justify-center px-2">
        <div className="max-w-[90%] rounded-full bg-line-soft px-3 py-1.5 text-center text-xs text-ink-muted dark:bg-charcoal-muted dark:text-ink-faint">
          <span>{message.body}</span>
          <span className="ml-2 text-[10px] text-ink-faint">{formatTime(message.createdAt)}</span>
        </div>
      </div>
    );
  }

  const own = layout === "own";

  return (
    <div
      className={`flex ${own ? "justify-end" : "justify-start"}`}
      data-sender-type={message.senderType}
    >
      <div
        className={`max-w-[min(80%,28rem)] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
          own
            ? message.isAiGenerated || message.senderType === "AI"
              ? "rounded-br-md border border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-500/40 dark:bg-brand-500/15 dark:text-brand-100"
              : "rounded-br-md bg-brand-500 text-white"
            : "rounded-bl-md border border-line bg-white text-ink dark:border-charcoal-muted dark:bg-charcoal dark:text-white"
        }`}
      >
        <div
          className={`mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide ${
            own && !(message.isAiGenerated || message.senderType === "AI")
              ? "text-white/80"
              : "text-ink-faint dark:text-ink-faint"
          }`}
        >
          <span>{label}</span>
          {(message.isAiGenerated || message.senderType === "AI") && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal ${
                own && !(message.isAiGenerated || message.senderType === "AI")
                  ? "bg-white/20 text-white"
                  : "bg-brand-100 text-brand-700 dark:bg-brand-500/25 dark:text-brand-200"
              }`}
            >
              AI
            </span>
          )}
        </div>
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>
        <div
          className={`mt-1.5 text-right text-[11px] ${
            own && !(message.isAiGenerated || message.senderType === "AI")
              ? "text-white/70"
              : "text-ink-faint"
          }`}
        >
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}
