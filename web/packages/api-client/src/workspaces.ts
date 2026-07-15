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

export type InviteMemberRequest = {
  email: string;
  role: "Admin" | "Agent" | "Viewer";
};

export type InviteMemberResponse = {
  inviteId: string;
  email: string;
  role: string;
  expiresAt: string;
};

export type WorkspaceMember = {
  userId?: string | null;
  inviteId?: string | null;
  email: string;
  fullName: string;
  role: string;
  status: "Active" | "Pending" | string;
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

export async function listMembers(client: ApiClient): Promise<WorkspaceMember[]> {
  return client.get<WorkspaceMember[]>(API_ROUTES.workspaces.members);
}

export async function inviteMember(
  client: ApiClient,
  payload: InviteMemberRequest,
): Promise<InviteMemberResponse> {
  return client.post<InviteMemberResponse>(API_ROUTES.workspaces.invite, payload);
}
