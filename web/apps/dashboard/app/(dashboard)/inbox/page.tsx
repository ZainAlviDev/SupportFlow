"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { HubMessageReceived } from "@/lib/signalr";
import { ConversationList } from "@/components/inbox/ConversationList";
import { ConversationThread } from "@/components/inbox/ConversationThread";
import { CustomerSidebar } from "@/components/inbox/CustomerSidebar";
import { useConversationTyping } from "@/hooks/useConversationTyping";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { useSignalR } from "@/hooks/useSignalR";
import { useInboxStore } from "@/stores/inboxStore";

export default function InboxPage() {
  const selectedConversationId = useInboxStore((s) => s.selectedConversationId);
  const setSelectedConversationId = useInboxStore((s) => s.setSelectedConversationId);
  const statusFilter = useInboxStore((s) => s.statusFilter);
  const assigneeFilter = useInboxStore((s) => s.assigneeFilter);

  const listParams = useMemo(
    () => ({
      status: statusFilter === "all" ? undefined : statusFilter,
      assignee: assigneeFilter === "all" ? undefined : assigneeFilter,
      page: 1,
      pageSize: 50,
    }),
    [statusFilter, assigneeFilter],
  );

  const {
    conversations,
    isLoading: listLoading,
    error: listError,
    refresh,
    touchConversation,
    upsertConversation,
    startConversationForCustomer,
  } = useConversations(listParams);

  const {
    messages,
    isLoading: messagesLoading,
    isSending,
    error: messagesError,
    appendMessage,
    sendMessage,
  } = useMessages(selectedConversationId);

  const {
    typingNames,
    onTypingStarted,
    onTypingStopped,
    clearTyper,
  } = useConversationTyping(selectedConversationId);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const onMessageReceived = useCallback(
    (payload: HubMessageReceived) => {
      if (payload.conversationId === selectedConversationId) {
        appendMessage({
          id: payload.id,
          conversationId: payload.conversationId,
          tenantId: payload.tenantId,
          senderType: payload.senderType,
          senderId: payload.senderId,
          body: payload.body,
          isAiGenerated: payload.isAiGenerated,
          createdAt: payload.createdAt,
        });
        clearTyper(payload.senderId);
      }
      touchConversation(payload.conversationId, payload.createdAt);
    },
    [appendMessage, clearTyper, selectedConversationId, touchConversation],
  );

  const { isConnected, sendTyping, stopTyping, error: realtimeError } = useSignalR({
    conversationId: selectedConversationId,
    onMessageReceived,
    onTypingStarted,
    onTypingStopped,
    onConversationUpdated: (payload) => {
      if (payload.id) {
        upsertConversation({
          id: payload.id,
          tenantId: payload.tenantId,
          customerId: payload.customerId,
          status: payload.status,
          assigneeId: payload.assigneeId,
          channel: payload.channel,
          snoozedUntil: payload.snoozedUntil,
          lastMessageAt: payload.lastMessageAt,
          tags: payload.tags ?? [],
          createdAt: payload.createdAt,
          updatedAt: payload.updatedAt,
        });
        return;
      }

      if (payload.conversationId) {
        touchConversation(payload.conversationId, payload.lastMessageAt);
      }
    },
  });

  const handleTypingStart = useCallback(() => {
    if (!selectedConversationId) return;
    void sendTyping(selectedConversationId);
  }, [selectedConversationId, sendTyping]);

  const handleTypingStop = useCallback(() => {
    if (!selectedConversationId) return;
    void stopTyping(selectedConversationId);
  }, [selectedConversationId, stopTyping]);

  // Stop broadcasting typing when switching threads.
  const previousConversationIdRef = useRef<string | null>(null);
  useEffect(() => {
    const previous = previousConversationIdRef.current;
    if (previous && previous !== selectedConversationId) {
      void stopTyping(previous);
    }
    previousConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId, stopTyping]);

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-white px-4 dark:border-charcoal-muted dark:bg-charcoal">
        <div className="flex items-center gap-2.5">
          <h1 className="text-base font-semibold text-charcoal dark:text-white">Inbox</h1>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              isConnected
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
            }`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                isConnected ? "bg-emerald-500" : "animate-pulse bg-amber-500"
              }`}
            />
            {isConnected ? "Live" : "Connecting…"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-brand-500/40 hover:text-brand-700 dark:border-charcoal-muted dark:text-ink-faint dark:hover:text-brand-300"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
          </svg>
          Refresh
        </button>
      </div>

      {(realtimeError || listError) && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          {realtimeError ?? listError}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        {/* Mobile: master-detail — list hides when a thread is open. */}
        <div className={`${selectedConversationId ? "hidden md:flex" : "flex"} min-h-0 flex-col`}>
          <ConversationList
            conversations={conversations}
            isLoading={listLoading}
            error={listError}
            selectedId={selectedConversationId}
            onSelect={setSelectedConversationId}
            onCreate={async ({ username, initialMessage }) => {
              const created = await startConversationForCustomer({
                username,
                initialMessage,
              });
              setSelectedConversationId(created.id);
            }}
          />
        </div>

        <div className={`${selectedConversationId ? "flex" : "hidden md:flex"} min-h-0 flex-col`}>
          <ConversationThread
            conversation={selectedConversation}
            messages={messages}
            isLoading={messagesLoading}
            isSending={isSending}
            error={messagesError}
            typingNames={typingNames}
            onBack={() => setSelectedConversationId(null)}
            onSend={async (body, options) => {
              const sent = await sendMessage(body, options);
              touchConversation(sent.conversationId, sent.createdAt);
            }}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            onConversationUpdated={upsertConversation}
          />
        </div>

        <CustomerSidebar conversation={selectedConversation} />
      </div>
    </div>
  );
}
