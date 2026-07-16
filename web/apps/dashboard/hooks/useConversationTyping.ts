"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TypingStartedPayload, TypingStoppedPayload } from "@/lib/signalr";

type Typer = {
  name: string;
  expiresAt: number;
};

const TYPING_TTL_MS = 4000;

/**
 * Tracks who is typing in the open conversation from hub events.
 * Heartbeats from SendTyping refresh the TTL so continuous typing stays visible.
 */
export function useConversationTyping(conversationId: string | null) {
  const [typers, setTypers] = useState<Record<string, Typer>>({});
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  useEffect(() => {
    setTypers({});
  }, [conversationId]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      setTypers((prev) => {
        const next: Record<string, Typer> = {};
        let changed = false;
        for (const [key, value] of Object.entries(prev)) {
          if (value.expiresAt > now) {
            next[key] = value;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  const onTypingStarted = useCallback((payload: TypingStartedPayload) => {
    if (payload.conversationId !== conversationIdRef.current) return;

    const key = payload.senderId || payload.senderName || "unknown";
    const name = (payload.senderName || "Someone").trim() || "Someone";

    setTypers((prev) => ({
      ...prev,
      [key]: { name, expiresAt: Date.now() + TYPING_TTL_MS },
    }));
  }, []);

  const onTypingStopped = useCallback((payload: TypingStoppedPayload) => {
    if (payload.conversationId !== conversationIdRef.current) return;

    setTypers((prev) => {
      if (payload.senderId && prev[payload.senderId]) {
        const { [payload.senderId]: _, ...rest } = prev;
        return rest;
      }

      // Legacy payloads without senderId: clear everyone for this room.
      return {};
    });
  }, []);

  const clearTyper = useCallback((senderId: string | null | undefined) => {
    if (!senderId) return;
    setTypers((prev) => {
      if (!prev[senderId]) return prev;
      const { [senderId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAll = useCallback(() => setTypers({}), []);

  const names = useMemo(
    () => Object.values(typers).map((t) => t.name),
    [typers],
  );

  return {
    typingNames: names,
    onTypingStarted,
    onTypingStopped,
    clearTyper,
    clearAll,
  };
}
