"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listMessages,
  sendMessage as sendMessageRequest,
  type Message,
} from "@supportflow/api-client";
import { api } from "@/lib/api";

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await listMessages(api, conversationId, { page: 1, pageSize: 100 });
      setMessages(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load messages.");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const appendMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((item) => item.id === message.id)) return prev;
      return [...prev, message].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });
  }, []);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!conversationId || !body.trim()) {
        throw new Error("Select a conversation and enter a message.");
      }

      setIsSending(true);
      setError(null);
      try {
        const sent = await sendMessageRequest(api, conversationId, { body: body.trim() });
        appendMessage(sent);
        return sent;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to send message.";
        setError(message);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [appendMessage, conversationId],
  );

  return {
    messages,
    isLoading,
    isSending,
    error,
    refresh,
    appendMessage,
    sendMessage,
  };
}
