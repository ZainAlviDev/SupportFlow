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

/** Text injected into the composer from outside (e.g. an accepted AI suggestion). */
export type ComposerDraft = {
  /** Unique per injection so the same text can be re-applied. */
  id: number;
  text: string;
  isAiGenerated: boolean;
};

type MessageComposerProps = {
  disabled?: boolean;
  sending?: boolean;
  placeholder?: string;
  draft?: ComposerDraft | null;
  suggesting?: boolean;
  onSuggest?: () => void;
  onSend: (body: string, options: { isAiGenerated: boolean }) => Promise<void> | void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
};

export function MessageComposer({
  disabled = false,
  sending = false,
  placeholder,
  draft = null,
  suggesting = false,
  onSuggest,
  onSend,
  onTypingStart,
  onTypingStop,
}: MessageComposerProps) {
  const fieldId = useId();
  const [body, setBody] = useState("");
  const [isAiDraft, setIsAiDraft] = useState(false);
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

  // Apply externally injected drafts (accepted AI suggestions).
  useEffect(() => {
    if (!draft) return;
    setBody(draft.text.slice(0, MAX_LENGTH));
    setIsAiDraft(draft.isAiGenerated);
    setError(null);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      resize();
    });
  }, [draft]);

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
      await onSend(text, { isAiGenerated: isAiDraft });
      setBody("");
      setIsAiDraft(false);
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
              setIsAiDraft(false);
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
        {onSuggest && (
          <Button
            type="button"
            variant="outline"
            disabled={disabled || sending || suggesting}
            onClick={onSuggest}
            className="shrink-0"
            aria-label="Suggest a reply with AI"
            title="Suggest a reply with AI"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
              <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
            </svg>
            <span className="hidden sm:inline">{suggesting ? "Suggesting…" : "Suggest"}</span>
          </Button>
        )}
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
        <span className="flex items-center gap-2">
          <span>Enter to send · Shift+Enter for a new line</span>
          {isAiDraft && (
            <span className="rounded bg-brand-100 px-1.5 py-0.5 font-semibold text-brand-700 dark:bg-brand-500/25 dark:text-brand-200">
              AI draft
            </span>
          )}
        </span>
        {nearLimit && (
          <span className={remaining < 0 ? "text-red-600" : undefined}>
            {remaining} left
          </span>
        )}
      </div>
    </form>
  );
}
