"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { notificationHref, useNotifications } from "@/hooks/useNotifications";

function formatRelative(iso: string) {
  const date = new Date(iso);
  const deltaMs = Date.now() - date.getTime();
  const minutes = Math.round(deltaMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export function NotificationBell() {
  const { items, unreadCount, loading, error, refresh, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const badge = unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label={badge ? `${unreadCount} unread notifications` : "Notifications"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
          if (!open) void refresh();
        }}
        className="relative rounded-lg p-2 text-ink-soft transition-colors hover:bg-surface-soft hover:text-ink dark:text-ink-faint dark:hover:bg-charcoal-soft dark:hover:text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {badge && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-1.5 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-line bg-white shadow-panel dark:border-charcoal-muted dark:bg-charcoal-soft"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line px-3.5 py-3 dark:border-charcoal-muted">
            <div>
              <p className="text-sm font-semibold text-charcoal dark:text-white">Notifications</p>
              <p className="text-[11px] text-ink-muted">
                {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
              </p>
            </div>
            <button
              type="button"
              disabled={busy || unreadCount === 0}
              onClick={async () => {
                setBusy(true);
                try {
                  await markAllRead();
                } finally {
                  setBusy(false);
                }
              }}
              className="text-xs font-medium text-brand-700 disabled:opacity-40 dark:text-brand-300"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-3.5 py-8 text-center text-sm text-ink-muted">Loading…</p>
            ) : error && items.length === 0 ? (
              <div className="space-y-2 px-3.5 py-8 text-center">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="text-xs font-medium text-brand-700 dark:text-brand-300"
                >
                  Retry
                </button>
              </div>
            ) : items.length === 0 ? (
              <p className="px-3.5 py-8 text-center text-sm text-ink-muted">No notifications yet.</p>
            ) : (
              items.map((item) => {
                const href = notificationHref(item);
                const content = (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${item.isRead ? "font-medium text-ink-soft" : "font-semibold text-charcoal dark:text-white"}`}>
                        {item.title}
                      </p>
                      {!item.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden />}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{item.body}</p>
                    <p className="mt-1 text-[11px] text-ink-faint">{formatRelative(item.createdAt)}</p>
                  </>
                );

                return href ? (
                  <Link
                    key={item.id}
                    href={href}
                    role="menuitem"
                    onClick={async () => {
                      setOpen(false);
                      if (!item.isRead) {
                        try {
                          await markRead(item.id);
                        } catch {
                          // Navigation still proceeds.
                        }
                      }
                    }}
                    className="block border-b border-line px-3.5 py-3 transition-colors last:border-b-0 hover:bg-surface-soft dark:border-charcoal-muted dark:hover:bg-charcoal-muted"
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={async () => {
                      if (!item.isRead) {
                        try {
                          await markRead(item.id);
                        } catch {
                          // Keep panel open on failure.
                        }
                      }
                    }}
                    className="block w-full border-b border-line px-3.5 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-soft dark:border-charcoal-muted dark:hover:bg-charcoal-muted"
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
