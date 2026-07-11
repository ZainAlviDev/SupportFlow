/** API route paths — all relative to /api/v1 via gateway */

export const API_ROUTES = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  workspaces: {
    root: "/workspaces",
    current: "/workspaces/current",
    members: "/workspaces/current/members",
    invite: "/workspaces/current/members/invite",
    apiKeys: "/workspaces/current/api-keys",
  },
  conversations: "/conversations",
  tickets: "/tickets",
  customers: "/customers",
  knowledge: "/knowledge/articles",
  ai: {
    suggestReply: "/ai/suggest-reply",
    summarize: "/ai/summarize",
  },
  widget: {
    config: "/widget/config",
    conversations: "/widget/conversations",
  },
  notifications: "/notifications",
} as const;
