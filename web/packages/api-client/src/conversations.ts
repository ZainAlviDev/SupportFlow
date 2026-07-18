import type { ApiClient } from "./client";
import { API_ROUTES } from "./routes";

export type Conversation = {
  id: string;
  tenantId: string;
  customerId: string;
  status: string;
  assigneeId?: string | null;
  channel: string;
  snoozedUntil?: string | null;
  lastMessageAt: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string | null;
};

export type Message = {
  id: string;
  conversationId: string;
  tenantId: string;
  senderType: string;
  senderId?: string | null;
  body: string;
  isAiGenerated: boolean;
  createdAt: string;
};

export type ListConversationsParams = {
  status?: string;
  assignee?: string;
  customerId?: string;
  page?: number;
  pageSize?: number;
};

export type CreateConversationPayload = {
  customerId: string;
  channel?: string;
  assigneeId?: string;
  tags?: string[];
  initialMessage?: string;
};

export type SendMessagePayload = {
  body: string;
  isAiGenerated?: boolean;
};

function toQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `?${text}` : "";
}

export async function listConversations(
  client: ApiClient,
  params: ListConversationsParams = {},
): Promise<Conversation[]> {
  const query = toQuery({
    status: params.status,
    assignee: params.assignee,
    customerId: params.customerId,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 50,
  });
  return client.get<Conversation[]>(`${API_ROUTES.conversations}${query}`);
}

export async function getConversation(
  client: ApiClient,
  conversationId: string,
): Promise<Conversation> {
  return client.get<Conversation>(`${API_ROUTES.conversations}/${conversationId}`);
}

export async function createConversation(
  client: ApiClient,
  payload: CreateConversationPayload,
): Promise<Conversation> {
  return client.post<Conversation>(API_ROUTES.conversations, payload);
}

export async function updateConversation(
  client: ApiClient,
  conversationId: string,
  payload: {
    status?: string;
    assigneeId?: string;
    clearAssignee?: boolean;
    snoozedUntil?: string;
    clearSnooze?: boolean;
    tags?: string[];
  },
): Promise<Conversation> {
  return client.patch<Conversation>(`${API_ROUTES.conversations}/${conversationId}`, payload);
}

/** Claim for current user, or assign to assigneeId when provided. */
export async function assignConversation(
  client: ApiClient,
  conversationId: string,
  payload: { assigneeId?: string } = {},
): Promise<Conversation> {
  return client.post<Conversation>(`${API_ROUTES.conversations}/${conversationId}/assign`, payload);
}

export async function unassignConversation(
  client: ApiClient,
  conversationId: string,
): Promise<Conversation> {
  return client.post<Conversation>(`${API_ROUTES.conversations}/${conversationId}/unassign`);
}

export async function changeConversationStatus(
  client: ApiClient,
  conversationId: string,
  payload: { status: string; snoozedUntil?: string },
): Promise<Conversation> {
  return client.post<Conversation>(`${API_ROUTES.conversations}/${conversationId}/status`, payload);
}

export async function listMessages(
  client: ApiClient,
  conversationId: string,
  params: { page?: number; pageSize?: number } = {},
): Promise<Message[]> {
  const query = toQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 100,
  });
  return client.get<Message[]>(`${API_ROUTES.conversations}/${conversationId}/messages${query}`);
}

export async function sendMessage(
  client: ApiClient,
  conversationId: string,
  payload: SendMessagePayload,
): Promise<Message> {
  return client.post<Message>(`${API_ROUTES.conversations}/${conversationId}/messages`, payload);
}
