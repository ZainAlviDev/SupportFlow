"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  suggestReply,
  type Conversation,
  type Message,
  type SuggestReplyResult,
} from "@supportflow/api-client";
import { api } from "@/lib/api";
import { AiSuggestionPanel } from "@/components/inbox/AiSuggestionPanel";
import { ConversationActions } from "@/components/inbox/ConversationActions";
import { AiLoader } from "@/components/ui/AiLoader";
import { MessageBubble } from "@/components/inbox/MessageBubble";
import { MessageComposer, type ComposerDraft } from "@/components/inbox/MessageComposer";
import { TypingIndicator } from "@/components/inbox/TypingIndicator";

type ConversationThreadProps = {
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  typingNames: string[];
  onBack?: () => void;
  onSend: (body: string, options: { isAiGenerated: boolean }) => Promise<void>;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onConversationUpdated: (conversation: Conversation) => void;
};

function subjectHintFromMessages(messages: Message[]) {
  const customerMessage = messages.find((message) => message.senderType === "Customer");
  return (customerMessage ?? messages[0])?.body;
}

const STATUS_TONES: Record<string, string> = {
  Open: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
  Pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
  Resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  Snoozed: "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200",
};

export function ConversationThread({
  conversation,
  messages,
  isLoading,
  isSending,
  error,
  typingNames,
  onBack,
  onSend,
  onTypingStart,
  onTypingStop,
  onConversationUpdated,
}: ConversationThreadProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [suggestion, setSuggestion] = useState<SuggestReplyResult | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [composerDraft, setComposerDraft] = useState<ComposerDraft | null>(null);
  const suggestRequestRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingNames.length, conversation?.id]);

  // Suggestions belong to one thread; drop them when switching.
  useEffect(() => {
    setSuggestion(null);
    setIsSuggesting(false);
    setSuggestError(null);
    setComposerDraft(null);
    suggestRequestRef.current += 1;
  }, [conversation?.id]);

  const handleSuggest = useCallback(async () => {
    if (!conversation || isSuggesting) return;

    const requestId = ++suggestRequestRef.current;
    setIsSuggesting(true);
    setSuggestError(null);
    setSuggestion(null);
    try {
      const result = await suggestReply(api, { conversationId: conversation.id });
      if (suggestRequestRef.current !== requestId) return;
      setSuggestion(result);
    } catch (err) {
      if (suggestRequestRef.current !== requestId) return;
      setSuggestError(err instanceof Error ? err.message : "Unable to suggest a reply.");
    } finally {
      if (suggestRequestRef.current === requestId) {
        setIsSuggesting(false);
      }
    }
  }, [conversation, isSuggesting]);

  const dismissSuggestion = useCallback(() => {
    suggestRequestRef.current += 1;
    setSuggestion(null);
    setSuggestError(null);
    setIsSuggesting(false);
  }, []);

  const acceptSuggestion = useCallback((text: string) => {
    setComposerDraft({ id: Date.now(), text, isAiGenerated: true });
    setSuggestion(null);
    setSuggestError(null);
  }, []);

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted px-6 text-center dark:bg-charcoal-soft">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-charcoal">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-ink-faint">
            <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-semibold text-charcoal dark:text-white">Select a conversation</p>
        <p className="mt-1 max-w-sm text-sm text-ink-muted">
          Choose a thread from the list to read messages and reply in real time.
        </p>
      </div>
    );
  }

  const customerShort = conversation.customerId.slice(0, 8);
  const statusTone = STATUS_TONES[conversation.status] ?? "bg-line-soft text-ink-soft";

  return (
    <div className="flex h-full min-h-0 flex-col bg-muted dark:bg-charcoal-soft">
      <header className="shrink-0 border-b border-line bg-white px-3 py-3 sm:px-4 dark:border-charcoal-muted dark:bg-charcoal">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {onBack && (
              <button
                type="button"
                aria-label="Back to conversations"
                onClick={onBack}
                className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-soft md:hidden dark:text-ink-faint dark:hover:bg-charcoal-soft"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold uppercase text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
              {customerShort.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-semibold text-charcoal dark:text-white">
                  Customer {customerShort}
                </h2>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone}`}>
                  {conversation.status}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-ink-muted">{conversation.channel}</p>
            </div>
          </div>
        </div>
        <div className="mt-2.5">
          <ConversationActions
            conversation={conversation}
            subjectHint={subjectHintFromMessages(messages)}
            onUpdated={onConversationUpdated}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4">
        {isLoading && (
          <div className="flex justify-center py-10">
            <AiLoader size="sm" label="Loading messages" />
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <p className="text-sm text-ink-muted">No messages yet. Send the first reply.</p>
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <TypingIndicator names={typingNames} />
        <div ref={bottomRef} />
      </div>

      <AiSuggestionPanel
        loading={isSuggesting}
        error={suggestError}
        result={suggestion}
        onAccept={acceptSuggestion}
        onDismiss={dismissSuggestion}
      />

      <MessageComposer
        sending={isSending}
        draft={composerDraft}
        suggesting={isSuggesting}
        onSuggest={() => void handleSuggest()}
        onSend={onSend}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
      />
    </div>
  );
}
