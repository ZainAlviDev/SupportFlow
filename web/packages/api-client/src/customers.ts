import type { ApiClient } from "./client";
import { API_ROUTES } from "./routes";

export type Customer = {
  id: string;
  tenantId: string;
  name?: string | null;
  email?: string | null;
  username?: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt?: string | null;
};

export type CreateCustomerPayload = {
  name?: string;
  email?: string;
  username?: string;
};

export type ListCustomersParams = {
  search?: string;
  page?: number;
  pageSize?: number;
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

export async function listCustomers(
  client: ApiClient,
  params: ListCustomersParams = {},
): Promise<Customer[]> {
  return client.get<Customer[]>(
    `${API_ROUTES.customers}${toQuery({
      search: params.search,
      page: params.page,
      pageSize: params.pageSize,
    })}`,
  );
}

export async function createCustomer(
  client: ApiClient,
  payload: CreateCustomerPayload,
): Promise<Customer> {
  return client.post<Customer>(API_ROUTES.customers, payload);
}
