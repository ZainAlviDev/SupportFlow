"use client";

import { useEffect, useRef } from "react";
import type { Conversation, Message } from "@supportflow/api-client";
import { ConversationActions } from "@/components/inbox/ConversationActions";
import { MessageBubble } from "@/components/inbox/MessageBubble";
import { MessageComposer } from "@/components/inbox/MessageComposer";
import { TypingIndicator } from "@/components/inbox/TypingIndicator";

type ConversationThreadProps = {
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  typingNames: string[];
  onSend: (body: string) => Promise<void>;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onConversationUpdated: (conversation: Conversation) => void;
};

export function ConversationThread({
  conversation,
  messages,
  isLoading,
  isSending,
  error,
  typingNames,
  onSend,
  onTypingStart,
  onTypingStop,
  onConversationUpdated,
}: ConversationThreadProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingNames.length, conversation?.id]);

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted px-6 text-center dark:bg-charcoal-soft">
        <p className="text-sm font-medium text-ink-soft dark:text-ink-faint">Select a conversation</p>
        <p className="mt-1 max-w-sm text-sm text-ink-muted">
          Choose a thread from the list to read messages and reply in real time.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-muted dark:bg-charcoal-soft">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line bg-white px-4 py-3 dark:border-charcoal-muted dark:bg-charcoal">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-charcoal dark:text-white">
            Conversation
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Customer · {conversation.customerId.slice(0, 8)}… · {conversation.channel}
          </p>
        </div>
        <ConversationActions conversation={conversation} onUpdated={onConversationUpdated} />
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {isLoading && (
          <p className="text-sm text-ink-muted">Loading messages…</p>
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

      <MessageComposer
        sending={isSending}
        onSend={onSend}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
      />
    </div>
  );
}
