import type { KeyboardEvent } from "react";
import type { WidgetBranding, WidgetMessage } from "../types";

type ChatWindowProps = {
  open: boolean;
  onClose: () => void;
  branding: WidgetBranding | null;
  messages: WidgetMessage[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  busy: boolean;
  error: string | null;
  color: string;
  position: string;
};

function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export function ChatWindow({
  open,
  onClose,
  branding,
  messages,
  draft,
  onDraftChange,
  onSend,
  onKeyDown,
  busy,
  error,
  color,
  position,
}: ChatWindowProps) {
  if (!open) return null;

  const isLeft = position === "bottom-left";
  const title = branding?.workspaceName || "Support";
  const welcome = branding?.welcomeMessage || "Hi! How can we help?";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 92,
        [isLeft ? "left" : "right"]: 24,
        width: 360,
        maxWidth: "calc(100vw - 32px)",
        height: 520,
        maxHeight: "calc(100vh - 120px)",
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 18px 48px rgba(15, 23, 42, 0.22)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 2147483001,
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
    >
      <header
        style={{
          padding: "14px 16px",
          background: color,
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>We typically reply instantly</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          style={{
            background: "rgba(255,255,255,0.16)",
            border: "none",
            color: "white",
            width: 32,
            height: 32,
            borderRadius: 999,
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          ×
        </button>
      </header>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          background: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            alignSelf: "flex-start",
            maxWidth: "85%",
            background: "white",
            borderRadius: "14px 14px 14px 4px",
            padding: "10px 12px",
            fontSize: 13,
            color: "#334155",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          {welcome}
        </div>

        {messages.map((message) => {
          const mine = message.senderType === "Customer";
          return (
            <div
              key={message.id}
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "85%",
              }}
            >
              <div
                style={{
                  background: mine ? color : "white",
                  color: mine ? "white" : "#0f172a",
                  borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  padding: "10px 12px",
                  fontSize: 13,
                  lineHeight: 1.45,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {message.body}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  color: "#94a3b8",
                  textAlign: mine ? "right" : "left",
                }}
              >
                {formatTime(message.createdAt)}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{ padding: "8px 12px", color: "#b91c1c", fontSize: 12, background: "#fef2f2" }}>
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        style={{
          borderTop: "1px solid #e2e8f0",
          padding: 12,
          display: "flex",
          gap: 8,
          background: "white",
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message…"
          rows={1}
          disabled={busy}
          style={{
            flex: 1,
            resize: "none",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "10px 12px",
            fontSize: 13,
            outline: "none",
            fontFamily: "inherit",
            maxHeight: 96,
          }}
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          style={{
            border: "none",
            background: color,
            color: "white",
            borderRadius: 12,
            padding: "0 14px",
            fontWeight: 600,
            cursor: busy || !draft.trim() ? "default" : "pointer",
            opacity: busy || !draft.trim() ? 0.6 : 1,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
