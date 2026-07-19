export { API_ROUTES } from "./routes";
export {
  login,
  register,
  refresh,
  logout,
  me,
  updateTenant,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getRecoveryOptions,
  verifyEmail,
  previewInvite,
  acceptInvite,
} from "./auth";
export { createWorkspace, getCurrentWorkspace, updateCurrentWorkspace, listMembers, inviteMember } from "./workspaces";
export type {
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  WorkspaceDetails,
  InviteMemberRequest,
  InviteMemberResponse,
  WorkspaceMember,
  WidgetSettings,
  BusinessHoursDay,
  BusinessHoursSettings,
} from "./workspaces";
export { listApiKeys, createApiKey, revokeApiKey } from "./api-keys";
export type { ApiKey, CreatedApiKey, CreateApiKeyPayload } from "./api-keys";
export {
  listConversations,
  getConversation,
  createConversation,
  updateConversation,
  assignConversation,
  unassignConversation,
  changeConversationStatus,
  listMessages,
  sendMessage,
} from "./conversations";
export type {
  Conversation,
  Message,
  ListConversationsParams,
  CreateConversationPayload,
  SendMessagePayload,
} from "./conversations";
export {
  listCustomers,
  createCustomer,
  getCustomer,
  updateCustomer,
  listCustomerNotes,
  createCustomerNote,
} from "./customers";
export type {
  Customer,
  CustomerNote,
  CreateCustomerPayload,
  ListCustomersParams,
  UpdateCustomerPayload,
} from "./customers";
export { listTickets, getTicket, createTicket, updateTicket, listTicketComments, createTicketComment } from "./tickets";
export type {
  Ticket,
  TicketComment,
  ListTicketsParams,
  CreateTicketPayload,
  UpdateTicketPayload,
  CreateTicketCommentPayload,
} from "./tickets";
export {
  listKnowledgeArticles,
  getKnowledgeArticle,
  createKnowledgeArticle,
  updateKnowledgeArticle,
  deleteKnowledgeArticle,
} from "./knowledge";
export type {
  KnowledgeArticle,
  KnowledgeArticleStatus,
  ListKnowledgeArticlesParams,
  CreateKnowledgeArticlePayload,
  UpdateKnowledgeArticlePayload,
} from "./knowledge";
export { suggestReply } from "./ai";
export type { SuggestReplyPayload, SuggestReplyResult, SuggestReplySource } from "./ai";
export {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "./notifications";
export type {
  NotificationItem,
  UnreadCount,
  ListNotificationsParams,
} from "./notifications";
export { ApiClient, createApiClient } from "./client";
export type { ApiClientOptions } from "./client";
export type * from "./types";
