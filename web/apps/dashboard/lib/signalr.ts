import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

/** SignalR hub paths (via Gateway). */
export const SIGNALR_HUBS = {
  conversation: "/hubs/conversation",
  presence: "/hubs/presence",
  notifications: "/hubs/notifications",
} as const;

export type SignalRHubName = keyof typeof SIGNALR_HUBS;

/** Server → client event names (must match HubEventNames on the API). */
export const SIGNALR_EVENTS = {
  MessageReceived: "MessageReceived",
  ConversationUpdated: "ConversationUpdated",
  TypingStarted: "TypingStarted",
  TypingStopped: "TypingStopped",
  AgentPresenceChanged: "AgentPresenceChanged",
  NotificationReceived: "NotificationReceived",
} as const;

export type HubMessageReceived = {
  id: string;
  conversationId: string;
  tenantId: string;
  senderType: string;
  senderId?: string | null;
  body: string;
  isAiGenerated: boolean;
  createdAt: string;
};

export type TypingStartedPayload = {
  conversationId: string;
  senderName: string;
  senderId?: string | null;
};

export type TypingStoppedPayload = {
  conversationId: string;
  senderId?: string | null;
};

export type AgentPresenceChangedPayload = {
  userId: string;
  displayName?: string | null;
  isOnline: boolean;
};

export type ConversationUpdatedPayload = {
  id: string;
  tenantId: string;
  customerId: string;
  status: string;
  assigneeId?: string | null;
  channel: string;
  snoozedUntil?: string | null;
  lastMessageAt: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string | null;
  /** Legacy lightweight payload from older message events. */
  conversationId?: string;
};

export type OnlineAgent = {
  userId: string;
  displayName?: string | null;
};

export type NotificationReceivedPayload = {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  resourceType?: string | null;
  resourceId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
};

export function getSignalRUrl(hub: SignalRHubName) {
  const base = process.env.NEXT_PUBLIC_SIGNALR_URL ?? "http://localhost:5000";
  return `${base.replace(/\/$/, "")}${SIGNALR_HUBS[hub]}`;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sf_access_token");
}

/** Build a JWT-authenticated hub connection (token via access_token query for WebSockets). */
export function createHubConnection(hub: SignalRHubName): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(getSignalRUrl(hub), {
      accessTokenFactory: () => getAccessToken() ?? "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(
      process.env.NODE_ENV === "development" ? LogLevel.Information : LogLevel.Warning,
    )
    .build();
}

export function isHubConnected(connection: HubConnection | null | undefined): boolean {
  return connection?.state === HubConnectionState.Connected;
}

export async function startHub(connection: HubConnection): Promise<void> {
  if (
    connection.state === HubConnectionState.Connected ||
    connection.state === HubConnectionState.Connecting ||
    connection.state === HubConnectionState.Reconnecting
  ) {
    return;
  }

  await connection.start();
}

export async function stopHub(connection: HubConnection | null | undefined): Promise<void> {
  if (!connection) return;
  if (connection.state === HubConnectionState.Disconnected) return;
  await connection.stop();
}
