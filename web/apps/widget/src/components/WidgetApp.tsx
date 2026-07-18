import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { WidgetApi } from "../lib/api";
import { createWidgetHub } from "../lib/signalr";
import {
  getOrCreateVisitorId,
  getStoredConversationId,
  storeConversationId,
} from "../lib/visitor";
import type { WidgetBranding, WidgetInitOptions, WidgetMessage } from "../types";
import { WidgetButton } from "./WidgetButton";
import { ChatWindow } from "./ChatWindow";

type WidgetAppProps = {
  options: WidgetInitOptions;
};

function resolveUrls(options: WidgetInitOptions) {
  const envApi = import.meta.env.VITE_API_BASE_URL;
  const envSignalr = import.meta.env.VITE_SIGNALR_URL;
  return {
    apiBaseUrl: options.apiBaseUrl || envApi || "http://localhost:5000/api/v1",
    signalrUrl: options.signalrUrl || envSignalr || "http://localhost:5000",
  };
}

export function WidgetApp({ options }: WidgetAppProps) {
  const urls = useMemo(() => resolveUrls(options), [options]);
  const api = useMemo(() => new WidgetApi(urls.apiBaseUrl, options.apiKey), [urls.apiBaseUrl, options.apiKey]);
  const visitorId = useMemo(() => getOrCreateVisitorId(), []);

  const [open, setOpen] = useState(false);
  const [branding, setBranding] = useState<WidgetBranding | null>(null);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(getStoredConversationId());
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const hubRef = useRef<ReturnType<typeof createWidgetHub> | null>(null);
  const joinedRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const config = await api.getConfig();
        if (!cancelled) {
          setBranding(config);
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load widget.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    const hub = createWidgetHub({
      signalrUrl: urls.signalrUrl,
      apiKey: options.apiKey,
      onMessage: (message) => {
        setMessages((prev) => {
          if (prev.some((item) => item.id === message.id)) return prev;
          return [...prev, message];
        });
      },
    });
    hubRef.current = hub;
    void hub.connect().catch(() => {
      // REST polling fallback still works if hub is down.
    });

    return () => {
      void hub.disconnect();
      hubRef.current = null;
    };
  }, [options.apiKey, urls.signalrUrl]);

  useEffect(() => {
    if (!conversationId || !hubRef.current) return;
    const hub = hubRef.current;
    const previous = joinedRef.current;
    void (async () => {
      try {
        if (previous && previous !== conversationId) {
          await hub.leave(previous);
        }
        await hub.join(conversationId);
        joinedRef.current = conversationId;
      } catch {
        // ignore join failures; messages still load via REST
      }
    })();
  }, [conversationId]);

  const ensureConversation = async (initialMessage?: string) => {
    const started = await api.startConversation({
      visitorId,
      initialMessage,
    });
    storeConversationId(started.id);
    setConversationId(started.id);
    const history = await api.listMessages(started.id);
    setMessages(history);
    return started.id;
  };

  const openChat = async () => {
    setOpen(true);
    setError(null);
    if (!conversationId) return;
    try {
      const history = await api.listMessages(conversationId);
      setMessages(history);
    } catch {
      // Stale conversation id — start fresh on next send.
      setConversationId(null);
    }
  };

  const onSend = async (event?: FormEvent) => {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || busy) return;

    setBusy(true);
    setError(null);
    try {
      if (!conversationId) {
        await ensureConversation(body);
      } else {
        const sent = await api.sendMessage(conversationId, visitorId, body);
        setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
      }
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message.");
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void onSend();
    }
  };

  const color = branding?.primaryColor || "#10b981";
  const position = branding?.position === "bottom-left" ? "bottom-left" : "bottom-right";

  return (
    <>
      <WidgetButton
        color={color}
        position={position}
        onClick={() => void openChat()}
        disabled={!ready && !error}
      />
      <ChatWindow
        open={open}
        onClose={() => setOpen(false)}
        branding={branding}
        messages={messages}
        draft={draft}
        onDraftChange={setDraft}
        onSend={() => void onSend()}
        onKeyDown={onKeyDown}
        busy={busy}
        error={error}
        color={color}
        position={position}
      />
    </>
  );
}
