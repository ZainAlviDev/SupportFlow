const VISITOR_KEY = "sf_visitor_id";
const CONVERSATION_KEY = "sf_conversation_id";

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const next = randomId();
    localStorage.setItem(VISITOR_KEY, next);
    return next;
  } catch {
    return randomId();
  }
}

export function getStoredConversationId(): string | null {
  try {
    return localStorage.getItem(CONVERSATION_KEY);
  } catch {
    return null;
  }
}

export function storeConversationId(id: string) {
  try {
    localStorage.setItem(CONVERSATION_KEY, id);
  } catch {
    // ignore quota / private mode
  }
}
