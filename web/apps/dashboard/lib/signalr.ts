/** SignalR hub paths — wire up in Module 3 */

export const SIGNALR_HUBS = {
  conversation: "/hubs/conversation",
  presence: "/hubs/presence",
} as const;

export function getSignalRUrl(hub: keyof typeof SIGNALR_HUBS) {
  const base = process.env.NEXT_PUBLIC_SIGNALR_URL ?? "http://localhost:5000";
  return `${base}${SIGNALR_HUBS[hub]}`;
}
