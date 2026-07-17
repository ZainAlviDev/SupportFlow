export type WidgetInitOptions = {
  apiKey: string;
  apiBaseUrl?: string;
  signalrUrl?: string;
};

export type WidgetBranding = {
  workspaceName: string;
  primaryColor: string;
  position: "bottom-right" | "bottom-left" | string;
  welcomeMessage: string;
  preChatEnabled: boolean;
};

export type WidgetConversation = {
  id: string;
  customerId: string;
  status: string;
  lastMessageAt: string;
  createdAt: string;
};

export type WidgetMessage = {
  id: string;
  conversationId: string;
  senderType: string;
  body: string;
  createdAt: string;
};
