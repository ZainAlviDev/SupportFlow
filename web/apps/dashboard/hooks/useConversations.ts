"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createConversation,
  createCustomer,
  listConversations,
  type Conversation,
  type CreateConversationPayload,
  type ListConversationsParams,
} from "@supportflow/api-client";
import { api } from "@/lib/api";

export function useConversations(params: ListConversationsParams = {}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listConversations(api, params);
      setConversations(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load conversations.");
    } finally {
      setIsLoading(false);
    }
  }, [params.status, params.assignee, params.page, params.pageSize]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upsertConversation = useCallback((conversation: Conversation) => {
    setConversations((prev) => {
      const without = prev.filter((item) => item.id !== conversation.id);
      return [conversation, ...without].sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
      );
    });
  }, []);

  const touchConversation = useCallback((conversationId: string, lastMessageAt: string) => {
    setConversations((prev) =>
      [...prev]
        .map((item) =>
          item.id === conversationId ? { ...item, lastMessageAt } : item,
        )
        .sort(
          (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
        ),
    );
  }, []);

  const startConversation = useCallback(async (payload: CreateConversationPayload) => {
    const created = await createConversation(api, payload);
    upsertConversation(created);
    return created;
  }, [upsertConversation]);

  const startConversationForCustomer = useCallback(
    async (payload: {
      username: string;
      initialMessage?: string;
    }) => {
      const customer = await createCustomer(api, {
        username: payload.username,
        name: payload.username,
      });
      return startConversation({
        customerId: customer.id,
        initialMessage: payload.initialMessage,
      });
    },
    [startConversation],
  );

  return {
    conversations,
    isLoading,
    error,
    refresh,
    upsertConversation,
    touchConversation,
    startConversation,
    startConversationForCustomer,
  };
}
