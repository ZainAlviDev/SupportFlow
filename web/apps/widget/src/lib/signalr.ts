import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import type { WidgetMessage } from "../types";

export type HubMessageReceived = {
  id: string;
  conversationId: string;
  senderType: string;
  body: string;
  createdAt: string;
};

export function createWidgetHub(options: {
  signalrUrl: string;
  apiKey: string;
  onMessage: (message: WidgetMessage) => void;
}) {
  const base = options.signalrUrl.replace(/\/$/, "");
  const connection: HubConnection = new HubConnectionBuilder()
    .withUrl(`${base}/hubs/conversation`, {
      accessTokenFactory: () => options.apiKey,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(LogLevel.Warning)
    .build();

  connection.on("MessageReceived", (payload: HubMessageReceived) => {
    options.onMessage({
      id: payload.id,
      conversationId: payload.conversationId,
      senderType: payload.senderType,
      body: payload.body,
      createdAt: payload.createdAt,
    });
  });

  return {
    async connect() {
      if (connection.state === HubConnectionState.Disconnected) {
        await connection.start();
      }
    },
    async join(conversationId: string) {
      await connection.invoke("JoinConversation", conversationId);
    },
    async leave(conversationId: string) {
      try {
        await connection.invoke("LeaveConversation", conversationId);
      } catch {
        // best-effort
      }
    },
    async disconnect() {
      if (connection.state !== HubConnectionState.Disconnected) {
        await connection.stop();
      }
    },
    get isConnected() {
      return connection.state === HubConnectionState.Connected;
    },
  };
}
