"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HubConnection } from "@microsoft/signalr";
import { useAuth } from "@/hooks/useAuth";
import {
  createHubConnection,
  isHubConnected,
  SIGNALR_EVENTS,
  startHub,
  stopHub,
  type AgentPresenceChangedPayload,
  type ConversationUpdatedPayload,
  type HubMessageReceived,
  type OnlineAgent,
  type TypingStartedPayload,
  type TypingStoppedPayload,
} from "@/lib/signalr";

export type UseSignalROptions = {
  /** Connect when the user is authenticated (default true). */
  autoConnect?: boolean;
  /** When set, JoinConversation / LeaveConversation track this room. */
  conversationId?: string | null;
  onMessageReceived?: (message: HubMessageReceived) => void;
  onTypingStarted?: (payload: TypingStartedPayload) => void;
  onTypingStopped?: (payload: TypingStoppedPayload) => void;
  onConversationUpdated?: (payload: ConversationUpdatedPayload) => void;
  onAgentPresenceChanged?: (payload: AgentPresenceChangedPayload) => void;
};

export type UseSignalRResult = {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  joinConversation: (conversationId: string) => Promise<void>;
  leaveConversation: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, body: string) => Promise<void>;
  sendTyping: (conversationId: string) => Promise<void>;
  stopTyping: (conversationId: string) => Promise<void>;
  setOnline: () => Promise<void>;
  setOffline: () => Promise<void>;
  getOnlineAgents: () => Promise<OnlineAgent[]>;
};

export function useSignalR(options: UseSignalROptions = {}): UseSignalRResult {
  const {
    autoConnect = true,
    conversationId = null,
    onMessageReceived,
    onTypingStarted,
    onTypingStopped,
    onConversationUpdated,
    onAgentPresenceChanged,
  } = options;

  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversationRef = useRef<HubConnection | null>(null);
  const presenceRef = useRef<HubConnection | null>(null);
  const joinedConversationIdRef = useRef<string | null>(null);
  const connectPromiseRef = useRef<Promise<void> | null>(null);

  const handlersRef = useRef({
    onMessageReceived,
    onTypingStarted,
    onTypingStopped,
    onConversationUpdated,
    onAgentPresenceChanged,
  });
  handlersRef.current = {
    onMessageReceived,
    onTypingStarted,
    onTypingStopped,
    onConversationUpdated,
    onAgentPresenceChanged,
  };

  const wireConversationHandlers = useCallback((connection: HubConnection) => {
    connection.off(SIGNALR_EVENTS.MessageReceived);
    connection.off(SIGNALR_EVENTS.TypingStarted);
    connection.off(SIGNALR_EVENTS.TypingStopped);
    connection.off(SIGNALR_EVENTS.ConversationUpdated);

    connection.on(SIGNALR_EVENTS.MessageReceived, (payload: HubMessageReceived) => {
      handlersRef.current.onMessageReceived?.(payload);
    });
    connection.on(SIGNALR_EVENTS.TypingStarted, (payload: TypingStartedPayload) => {
      handlersRef.current.onTypingStarted?.(payload);
    });
    connection.on(SIGNALR_EVENTS.TypingStopped, (payload: TypingStoppedPayload) => {
      handlersRef.current.onTypingStopped?.(payload);
    });
    connection.on(SIGNALR_EVENTS.ConversationUpdated, (payload: ConversationUpdatedPayload) => {
      handlersRef.current.onConversationUpdated?.(payload);
    });
  }, []);

  const wirePresenceHandlers = useCallback((connection: HubConnection) => {
    connection.off(SIGNALR_EVENTS.AgentPresenceChanged);
    connection.on(SIGNALR_EVENTS.AgentPresenceChanged, (payload: AgentPresenceChangedPayload) => {
      handlersRef.current.onAgentPresenceChanged?.(payload);
    });
  }, []);

  const disconnect = useCallback(async () => {
    const joinedId = joinedConversationIdRef.current;
    const conversation = conversationRef.current;
    const presence = presenceRef.current;

    try {
      if (joinedId && isHubConnected(conversation)) {
        await conversation!.invoke("LeaveConversation", joinedId);
      }
    } catch {
      // Leaving during teardown is best-effort.
    }

    joinedConversationIdRef.current = null;

    try {
      if (isHubConnected(presence)) {
        await presence!.invoke("SetOffline");
      }
    } catch {
      // Ignore offline failures on disconnect.
    }

    await Promise.all([stopHub(conversation), stopHub(presence)]);
    conversationRef.current = null;
    presenceRef.current = null;
    connectPromiseRef.current = null;
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const connect = useCallback(async () => {
    if (!isAuthenticated) {
      setError("Sign in to connect realtime.");
      return;
    }

    if (isHubConnected(conversationRef.current) && isHubConnected(presenceRef.current)) {
      setIsConnected(true);
      return;
    }

    if (connectPromiseRef.current) {
      await connectPromiseRef.current;
      return;
    }

    setIsConnecting(true);
    setError(null);

    const run = (async () => {
      try {
        if (!conversationRef.current) {
          const connection = createHubConnection("conversation");
          wireConversationHandlers(connection);
          connection.onreconnected(() => setIsConnected(true));
          connection.onclose(() => setIsConnected(false));
          conversationRef.current = connection;
        }

        if (!presenceRef.current) {
          const connection = createHubConnection("presence");
          wirePresenceHandlers(connection);
          connection.onreconnected(async () => {
            setIsConnected(true);
            try {
              await connection.invoke("SetOnline");
            } catch {
              // Presence re-announce is best-effort.
            }
          });
          connection.onclose(() => setIsConnected(false));
          presenceRef.current = connection;
        }

        await Promise.all([
          startHub(conversationRef.current),
          startHub(presenceRef.current),
        ]);

        try {
          await presenceRef.current.invoke("SetOnline");
        } catch {
          // Presence optional at connect time.
        }

        setIsConnected(true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to connect to realtime hubs.";
        setError(message);
        setIsConnected(false);
        await Promise.all([stopHub(conversationRef.current), stopHub(presenceRef.current)]);
        conversationRef.current = null;
        presenceRef.current = null;
        throw err;
      } finally {
        setIsConnecting(false);
        connectPromiseRef.current = null;
      }
    })();

    connectPromiseRef.current = run;
    await run;
  }, [isAuthenticated, wireConversationHandlers, wirePresenceHandlers]);

  const ensureConnected = useCallback(async () => {
    if (!isHubConnected(conversationRef.current) || !isHubConnected(presenceRef.current)) {
      await connect();
    }
  }, [connect]);

  const joinConversation = useCallback(
    async (id: string) => {
      if (!id) return;
      await ensureConnected();
      const connection = conversationRef.current;
      if (!connection || !isHubConnected(connection)) {
        throw new Error("Conversation hub is not connected.");
      }

      const previous = joinedConversationIdRef.current;
      if (previous && previous !== id) {
        try {
          await connection.invoke("LeaveConversation", previous);
        } catch {
          // Ignore leave failures when switching rooms.
        }
      }

      await connection.invoke("JoinConversation", id);
      joinedConversationIdRef.current = id;
    },
    [ensureConnected],
  );

  const leaveConversation = useCallback(async (id: string) => {
    const connection = conversationRef.current;
    if (!connection || !isHubConnected(connection) || !id) return;

    await connection.invoke("LeaveConversation", id);
    if (joinedConversationIdRef.current === id) {
      joinedConversationIdRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(
    async (id: string, body: string) => {
      await ensureConnected();
      const connection = conversationRef.current;
      if (!connection || !isHubConnected(connection)) {
        throw new Error("Conversation hub is not connected.");
      }
      await connection.invoke("SendMessage", id, body);
    },
    [ensureConnected],
  );

  const sendTyping = useCallback(
    async (id: string) => {
      if (!isHubConnected(conversationRef.current)) return;
      await conversationRef.current!.invoke("SendTyping", id);
    },
    [],
  );

  const stopTyping = useCallback(async (id: string) => {
    if (!isHubConnected(conversationRef.current)) return;
    await conversationRef.current!.invoke("StopTyping", id);
  }, []);

  const setOnline = useCallback(async () => {
    await ensureConnected();
    await presenceRef.current?.invoke("SetOnline");
  }, [ensureConnected]);

  const setOffline = useCallback(async () => {
    if (!isHubConnected(presenceRef.current)) return;
    await presenceRef.current!.invoke("SetOffline");
  }, []);

  const getOnlineAgents = useCallback(async (): Promise<OnlineAgent[]> => {
    await ensureConnected();
    if (!presenceRef.current || !isHubConnected(presenceRef.current)) {
      return [];
    }
    return presenceRef.current.invoke<OnlineAgent[]>("GetOnlineAgents");
  }, [ensureConnected]);

  // Auto connect / disconnect with auth session.
  useEffect(() => {
    if (!autoConnect) return;

    if (isAuthenticated) {
      void connect().catch(() => {
        // Error state already set inside connect.
      });
    } else {
      void disconnect();
    }

    return () => {
      void disconnect();
    };
  }, [autoConnect, isAuthenticated, connect, disconnect]);

  // Keep JoinConversation in sync with the selected inbox thread.
  useEffect(() => {
    if (!autoConnect || !isAuthenticated || !isConnected) return;

    if (!conversationId) {
      const previous = joinedConversationIdRef.current;
      if (previous) {
        void leaveConversation(previous).catch(() => undefined);
      }
      return;
    }

    void joinConversation(conversationId).catch((err) => {
      setError(err instanceof Error ? err.message : "Unable to join conversation.");
    });
  }, [
    autoConnect,
    isAuthenticated,
    isConnected,
    conversationId,
    joinConversation,
    leaveConversation,
  ]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTyping,
    stopTyping,
    setOnline,
    setOffline,
    getOnlineAgents,
  };
}
