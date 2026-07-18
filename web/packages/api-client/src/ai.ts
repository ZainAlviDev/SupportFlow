import type { ApiClient } from "./client";
import { API_ROUTES } from "./routes";

export type SuggestReplySource = {
  articleId: string;
  articleTitle: string;
  excerpt: string;
  distance: number;
};

export type SuggestReplyPayload = {
  conversationId: string;
  prompt?: string;
};

export type SuggestReplyResult = {
  suggestion: string;
  sources: SuggestReplySource[];
};

export async function suggestReply(
  client: ApiClient,
  payload: SuggestReplyPayload,
): Promise<SuggestReplyResult> {
  return client.post<SuggestReplyResult>(API_ROUTES.ai.suggestReply, payload);
}
