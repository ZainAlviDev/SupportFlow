"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Button } from "@supportflow/ui";

const MAX_LENGTH = 8000;

type MessageComposerProps = {
  disabled?: boolean;
  sending?: boolean;
  placeholder?: string;
  onSend: (body: string) => Promise<void> | void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
};

export function MessageComposer({
  disabled = false,
  sending = false,
  placeholder,
  onSend,
  onTypingStart,
  onTypingStop,
}: MessageComposerProps) {
  const fieldId = useId();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingActiveRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingHeartbeatRef = useRef(0);
  const TYPING_IDLE_MS = 1500;
  const TYPING_HEARTBEAT_MS = 2000;

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  };

  useEffect(() => {
    resize();
  }, [body]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const clearTyping = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (typingActiveRef.current) {
      typingActiveRef.current = false;
      lastTypingHeartbeatRef.current = 0;
      onTypingStop?.();
    }
  };

  const bumpTyping = () => {
    if (disabled || sending) return;

    const now = Date.now();
    if (!typingActiveRef.current) {
      typingActiveRef.current = true;
      lastTypingHeartbeatRef.current = now;
      onTypingStart?.();
    } else if (now - lastTypingHeartbeatRef.current >= TYPING_HEARTBEAT_MS) {
      // Keep remote indicators alive while the agent keeps typing.
      lastTypingHeartbeatRef.current = now;
      onTypingStart?.();
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      typingActiveRef.current = false;
      lastTypingHeartbeatRef.current = 0;
      onTypingStop?.();
      typingTimerRef.current = null;
    }, TYPING_IDLE_MS);
  };

  const submit = async () => {
    const text = body.trim();
    if (!text || disabled || sending) return;

    if (text.length > MAX_LENGTH) {
      setError(`Message must be at most ${MAX_LENGTH} characters.`);
      return;
    }

    setError(null);
    clearTyping();
    try {
      await onSend(text);
      setBody("");
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        resize();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send.");
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  const remaining = MAX_LENGTH - body.length;
  const nearLimit = remaining <= 200;

  return (
    <form
      onSubmit={onSubmit}
      className="border-t border-line bg-white p-3 dark:border-charcoal-muted dark:bg-charcoal"
      aria-label="Message composer"
    >
      {error && (
        <p className="mb-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-end gap-2">
        <label htmlFor={fieldId} className="sr-only">
          Message
        </label>
        <textarea
          id={fieldId}
          ref={textareaRef}
          value={body}
          onChange={(event) => {
            const next = event.target.value.slice(0, MAX_LENGTH);
            setBody(next);
            if (next.trim()) {
              bumpTyping();
            } else {
              clearTyping();
            }
          }}
          onBlur={() => clearTyping()}
          onKeyDown={onKeyDown}
          disabled={disabled || sending}
          rows={1}
          maxLength={MAX_LENGTH}
          placeholder={
            placeholder ??
            (disabled ? "Select a conversation to reply" : "Write a reply…")
          }
          className="min-h-[2.75rem] max-h-36 w-full resize-none overflow-y-auto rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-charcoal-muted dark:bg-charcoal-soft dark:text-white"
        />
        <Button
          type="submit"
          disabled={disabled || sending || !body.trim()}
          className="shrink-0"
          aria-label={sending ? "Sending message" : "Send message"}
        >
          {sending ? "Sending…" : "Send"}
        </Button>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-ink-faint">
        <span>Enter to send · Shift+Enter for a new line</span>
        {nearLimit && (
          <span className={remaining < 0 ? "text-red-600" : undefined}>
            {remaining} left
          </span>
        )}
      </div>
    </form>
  );
}
