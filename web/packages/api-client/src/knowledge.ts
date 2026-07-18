import type { ApiClient } from "./client";
import { API_ROUTES } from "./routes";

export type KnowledgeArticleStatus = "Draft" | "Published";

export type KnowledgeArticle = {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  category?: string | null;
  status: KnowledgeArticleStatus;
  chunkCount: number;
  createdAt: string;
  updatedAt?: string | null;
};

export type ListKnowledgeArticlesParams = {
  search?: string;
  status?: KnowledgeArticleStatus | "";
  category?: string;
  page?: number;
  pageSize?: number;
};

export type CreateKnowledgeArticlePayload = {
  title: string;
  content: string;
  category?: string;
  publish?: boolean;
};

export type UpdateKnowledgeArticlePayload = {
  title: string;
  content: string;
  category?: string;
  status?: KnowledgeArticleStatus;
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

export async function listKnowledgeArticles(
  client: ApiClient,
  params: ListKnowledgeArticlesParams = {},
): Promise<KnowledgeArticle[]> {
  const query = toQuery({
    search: params.search,
    status: params.status,
    category: params.category,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 30,
  });
  return client.get<KnowledgeArticle[]>(`${API_ROUTES.knowledge}${query}`);
}

export async function getKnowledgeArticle(
  client: ApiClient,
  articleId: string,
): Promise<KnowledgeArticle> {
  return client.get<KnowledgeArticle>(`${API_ROUTES.knowledge}/${articleId}`);
}

export async function createKnowledgeArticle(
  client: ApiClient,
  payload: CreateKnowledgeArticlePayload,
): Promise<KnowledgeArticle> {
  return client.post<KnowledgeArticle>(API_ROUTES.knowledge, payload);
}

export async function updateKnowledgeArticle(
  client: ApiClient,
  articleId: string,
  payload: UpdateKnowledgeArticlePayload,
): Promise<KnowledgeArticle> {
  return client.put<KnowledgeArticle>(`${API_ROUTES.knowledge}/${articleId}`, payload);
}

export async function deleteKnowledgeArticle(
  client: ApiClient,
  articleId: string,
): Promise<void> {
  return client.delete(`${API_ROUTES.knowledge}/${articleId}`);
}
