"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { HubConnection } from "@microsoft/signalr";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@supportflow/api-client";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import {
  createHubConnection,
  isHubConnected,
  SIGNALR_EVENTS,
  startHub,
  stopHub,
  type NotificationReceivedPayload,
} from "@/lib/signalr";

type NotificationsContextValue = {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function upsertNotification(items: NotificationItem[], incoming: NotificationItem): NotificationItem[] {
  const without = items.filter((item) => item.id !== incoming.id);
  return [incoming, ...without].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const [listed, unread] = await Promise.all([
        listNotifications(api, { page: 1, pageSize: 30 }),
        getUnreadNotificationCount(api),
      ]);
      setItems(listed);
      setUnreadCount(unread.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const markRead = useCallback(async (id: string) => {
    const previous = items;
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item,
      ),
    );
    setUnreadCount((count) => Math.max(0, count - (previous.find((i) => i.id === id && !i.isRead) ? 1 : 0)));

    try {
      const updated = await markNotificationRead(api, id);
      setItems((current) => upsertNotification(current, updated));
    } catch (err) {
      setItems(previous);
      await refresh();
      throw err;
    }
  }, [items, refresh]);

  const markAllRead = useCallback(async () => {
    const previous = items;
    const previousCount = unreadCount;
    setItems((current) =>
      current.map((item) => ({ ...item, isRead: true, readAt: item.readAt ?? new Date().toISOString() })),
    );
    setUnreadCount(0);

    try {
      await markAllNotificationsRead(api);
    } catch (err) {
      setItems(previous);
      setUnreadCount(previousCount);
      throw err;
    }
  }, [items, unreadCount]);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      setUnreadCount(0);
      setError(null);
      setIsConnected(false);
      void stopHub(connectionRef.current);
      connectionRef.current = null;
      return;
    }

    void refresh();

    const connection = createHubConnection("notifications");
    connectionRef.current = connection;

    connection.on(SIGNALR_EVENTS.NotificationReceived, (payload: NotificationReceivedPayload) => {
      const incoming: NotificationItem = {
        id: payload.id,
        tenantId: payload.tenantId,
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        resourceType: payload.resourceType,
        resourceId: payload.resourceId,
        isRead: payload.isRead,
        readAt: payload.readAt,
        createdAt: payload.createdAt,
      };

      setItems((current) => {
        if (current.some((item) => item.id === incoming.id)) {
          return upsertNotification(current, incoming);
        }
        if (!incoming.isRead) {
          setUnreadCount((count) => count + 1);
        }
        return upsertNotification(current, incoming);
      });
    });

    connection.onreconnected(() => {
      setIsConnected(true);
      void refresh();
    });
    connection.onclose(() => setIsConnected(false));

    void startHub(connection)
      .then(() => setIsConnected(true))
      .catch((err) => {
        setIsConnected(false);
        setError(err instanceof Error ? err.message : "Unable to connect notifications.");
      });

    return () => {
      connection.off(SIGNALR_EVENTS.NotificationReceived);
      void stopHub(connection);
      if (connectionRef.current === connection) {
        connectionRef.current = null;
      }
      setIsConnected(false);
    };
  }, [isAuthenticated, refresh]);

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      loading,
      error,
      isConnected,
      refresh,
      markRead,
      markAllRead,
    }),
    [items, unreadCount, loading, error, isConnected, refresh, markRead, markAllRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider.");
  }
  return context;
}

export function notificationHref(item: NotificationItem): string | null {
  if (!item.resourceId) return null;
  if (item.resourceType === "conversation") return `/inbox?conversation=${item.resourceId}`;
  if (item.resourceType === "ticket") return `/tickets/${item.resourceId}`;
  return null;
}

export function isHubLive(connection: HubConnection | null | undefined) {
  return isHubConnected(connection);
}
