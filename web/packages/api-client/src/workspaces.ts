import type { ApiClient } from "./client";
import { API_ROUTES } from "./routes";

export type CreateWorkspaceRequest = {
  name: string;
  slug?: string;
  timezone?: string;
};

export type UpdateWorkspaceRequest = {
  name?: string;
  timezone?: string;
  settingsJson?: string;
};

export type WorkspaceDetails = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  plan: string;
  settingsJson?: string | null;
  createdAt: string;
};

export async function createWorkspace(
  client: ApiClient,
  payload: CreateWorkspaceRequest,
): Promise<WorkspaceDetails> {
  return client.post<WorkspaceDetails>(API_ROUTES.workspaces.root, payload);
}

export async function getCurrentWorkspace(client: ApiClient): Promise<WorkspaceDetails> {
  return client.get<WorkspaceDetails>(API_ROUTES.workspaces.current);
}

export async function updateCurrentWorkspace(
  client: ApiClient,
  payload: UpdateWorkspaceRequest,
): Promise<WorkspaceDetails> {
  return client.patch<WorkspaceDetails>(API_ROUTES.workspaces.current, payload);
}
