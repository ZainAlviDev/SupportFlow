import type { ApiClient } from "./client";
import { API_ROUTES } from "./routes";

export type Ticket = {
  id: string;
  tenantId: string;
  ticketNumber: string;
  customerId: string;
  conversationId?: string | null;
  subject: string;
  description?: string | null;
  priority: string;
  status: string;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type TicketComment = {
  id: string;
  ticketId: string;
  tenantId: string;
  authorId: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
};

export type ListTicketsParams = {
  status?: string;
  priority?: string;
  assignee?: string;
  customerId?: string;
  page?: number;
  pageSize?: number;
};

export type CreateTicketPayload = {
  customerId: string;
  subject: string;
  description?: string;
  priority?: string;
  conversationId?: string;
  assigneeId?: string;
};

export type UpdateTicketPayload = {
  subject?: string;
  description?: string;
  priority?: string;
  status?: string;
  assigneeId?: string;
  clearAssignee?: boolean;
};

export type CreateTicketCommentPayload = {
  body: string;
  isInternal?: boolean;
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

export async function listTickets(
  client: ApiClient,
  params: ListTicketsParams = {},
): Promise<Ticket[]> {
  return client.get<Ticket[]>(
    `${API_ROUTES.tickets}${toQuery({
      status: params.status,
      priority: params.priority,
      assignee: params.assignee,
      customerId: params.customerId,
      page: params.page,
      pageSize: params.pageSize,
    })}`,
  );
}

export async function getTicket(client: ApiClient, ticketId: string): Promise<Ticket> {
  return client.get<Ticket>(`${API_ROUTES.tickets}/${ticketId}`);
}

export async function createTicket(
  client: ApiClient,
  payload: CreateTicketPayload,
): Promise<Ticket> {
  return client.post<Ticket>(API_ROUTES.tickets, payload);
}

export async function updateTicket(
  client: ApiClient,
  ticketId: string,
  payload: UpdateTicketPayload,
): Promise<Ticket> {
  return client.patch<Ticket>(`${API_ROUTES.tickets}/${ticketId}`, payload);
}

export async function listTicketComments(
  client: ApiClient,
  ticketId: string,
  includeInternal = true,
): Promise<TicketComment[]> {
  return client.get<TicketComment[]>(
    `${API_ROUTES.tickets}/${ticketId}/comments${toQuery({ includeInternal })}`,
  );
}

export async function createTicketComment(
  client: ApiClient,
  ticketId: string,
  payload: CreateTicketCommentPayload,
): Promise<TicketComment> {
  return client.post<TicketComment>(`${API_ROUTES.tickets}/${ticketId}/comments`, payload);
}
