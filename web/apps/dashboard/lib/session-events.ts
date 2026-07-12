type SessionExpiredListener = () => void;

const listeners = new Set<SessionExpiredListener>();
let sessionExpiredNotified = false;

export function onSessionExpired(listener: SessionExpiredListener) {
  listeners.add(listener);

  // Replay if expiry already fired before this subscriber mounted.
  if (sessionExpiredNotified) {
    queueMicrotask(() => listener());
  }

  return () => {
    listeners.delete(listener);
  };
}

export function notifySessionExpired() {
  if (sessionExpiredNotified) {
    return;
  }

  sessionExpiredNotified = true;
  listeners.forEach((listener) => listener());
}

export function resetSessionExpiredFlag() {
  sessionExpiredNotified = false;
}

export function isSessionExpiredNotified() {
  return sessionExpiredNotified;
}
