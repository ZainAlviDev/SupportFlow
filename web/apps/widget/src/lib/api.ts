import type { WidgetBranding, WidgetConversation, WidgetMessage } from "../types";

type ApiEnvelope<T> = { data: T };

export class WidgetApi {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": this.apiKey,
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null) as
        | { error?: { message?: string } }
        | null;
      throw new Error(body?.error?.message ?? `Widget API error ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const json = (await response.json()) as ApiEnvelope<T>;
    return json.data;
  }

  getConfig() {
    return this.request<WidgetBranding>("/widget/config");
  }

  startConversation(payload: {
    visitorId: string;
    name?: string;
    email?: string;
    initialMessage?: string;
  }) {
    return this.request<WidgetConversation>("/widget/conversations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  listMessages(conversationId: string) {
    return this.request<WidgetMessage[]>(
      `/widget/conversations/${conversationId}/messages?page=1&pageSize=100`,
    );
  }

  sendMessage(conversationId: string, visitorId: string, body: string) {
    return this.request<WidgetMessage>(`/widget/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body, visitorId }),
    });
  }
}
