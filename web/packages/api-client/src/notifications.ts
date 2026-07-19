import type { ApiClient } from "./client";
import { API_ROUTES } from "./routes";

export type NotificationItem = {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  resourceType?: string | null;
  resourceId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
};

export type UnreadCount = {
  count: number;
};

export type ListNotificationsParams = {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
};

function toQuery(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `?${text}` : "";
}

export async function listNotifications(
  client: ApiClient,
  params: ListNotificationsParams = {},
): Promise<NotificationItem[]> {
  return client.get<NotificationItem[]>(
    `${API_ROUTES.notifications}${toQuery({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      unreadOnly: params.unreadOnly,
    })}`,
  );
}

export async function getUnreadNotificationCount(client: ApiClient): Promise<UnreadCount> {
  return client.get<UnreadCount>(`${API_ROUTES.notifications}/unread-count`);
}

export async function markNotificationRead(
  client: ApiClient,
  id: string,
): Promise<NotificationItem> {
  return client.post<NotificationItem>(`${API_ROUTES.notifications}/${id}/read`);
}

export async function markAllNotificationsRead(client: ApiClient): Promise<{ markedCount: number }> {
  return client.post<{ markedCount: number }>(`${API_ROUTES.notifications}/read-all`);
}
