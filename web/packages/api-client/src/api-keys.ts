import type { ApiClient } from "./client";
import { API_ROUTES } from "./routes";

export type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  allowedDomains: string[];
  createdAt: string;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
};

export type CreatedApiKey = ApiKey & {
  apiKey: string;
};

export type CreateApiKeyPayload = {
  name: string;
  allowedDomains?: string[];
};

export async function listApiKeys(client: ApiClient): Promise<ApiKey[]> {
  return client.get<ApiKey[]>(API_ROUTES.workspaces.apiKeys);
}

export async function createApiKey(
  client: ApiClient,
  payload: CreateApiKeyPayload,
): Promise<CreatedApiKey> {
  return client.post<CreatedApiKey>(API_ROUTES.workspaces.apiKeys, payload);
}

export async function revokeApiKey(client: ApiClient, id: string): Promise<void> {
  await client.delete(`${API_ROUTES.workspaces.apiKeys}/${id}`);
}
