"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SupportFlowLogo } from "@/components/brand/SupportFlowLogo";
import { useAuth } from "@/hooks/useAuth";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const iconProps = {
  width: 17,
  height: 17,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const navItems: NavItem[] = [
  {
    href: "/inbox",
    label: "Inbox",
    icon: (
      <svg {...iconProps} aria-hidden>
        <path d="M22 12h-6l-2 3h-4l-2-3H2" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
      </svg>
    ),
  },
  {
    href: "/tickets",
    label: "Tickets",
    icon: (
      <svg {...iconProps} aria-hidden>
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M13 5v2M13 17v2M13 11v2" />
      </svg>
    ),
  },
  {
    href: "/customers",
    label: "Customers",
    icon: (
      <svg {...iconProps} aria-hidden>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/knowledge",
    label: "Knowledge",
    icon: (
      <svg {...iconProps} aria-hidden>
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg {...iconProps} aria-hidden>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    ),
  },
];

function initialsOf(name: string | undefined | null) {
  if (!name) return "A";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, workspace } = useAuth();

  return (
    <aside className="flex h-full w-[268px] flex-col gap-3 border-r border-line bg-surface-soft p-3 dark:border-charcoal-muted dark:bg-charcoal">
      {/* Brand */}
      <Link
        href="/inbox"
        onClick={onNavigate}
        aria-label="Go to inbox"
        className="flex h-14 items-center rounded-2xl bg-white px-4 shadow-sm ring-1 ring-line transition-shadow hover:shadow-md dark:bg-charcoal-soft dark:ring-charcoal-muted"
      >
        <SupportFlowLogo variant="compact" />
      </Link>

      {/* Navigation card */}
      <nav className="flex-1 space-y-1 rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-line dark:bg-charcoal-soft dark:ring-charcoal-muted">
        <p className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-faint">
          Menu
        </p>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25"
                  : "text-ink-soft hover:translate-x-0.5 hover:bg-surface-soft dark:text-ink-faint dark:hover:bg-charcoal-muted dark:hover:text-white"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  active
                    ? "bg-white/20 text-white"
                    : "bg-surface-soft text-ink-muted group-hover:text-brand-600 dark:bg-charcoal-muted dark:group-hover:text-brand-300"
                }`}
              >
                {item.icon}
              </span>
              {item.label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/90" aria-hidden />
              )}
            </Link>
          );
        })}
      </nav>

      {/* AI copilot teaser */}
      <div className="rounded-2xl bg-gradient-to-br from-charcoal via-charcoal-soft to-charcoal p-3.5 ring-1 ring-brand-500/30">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/20 text-brand-300 [animation:sf-breathe_2s_ease-in-out_infinite]">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden>
              <path d="M12 2.5 13.8 9 20 10.8 13.8 12.6 12 19 10.2 12.6 4 10.8 10.2 9 12 2.5Z" />
            </svg>
          </span>
          <p className="text-xs font-semibold text-white">AI Copilot</p>
          <span className="ml-auto rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-medium text-brand-300">
            Soon
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-white/55">
          Suggested replies and instant summaries, right in your inbox.
        </p>
      </div>

      {/* User card */}
      <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-line dark:bg-charcoal-soft dark:ring-charcoal-muted">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
          {initialsOf(user?.fullName)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-charcoal dark:text-white">
            {user?.fullName ?? "Agent"}
          </p>
          <p className="truncate text-xs text-ink-muted">{workspace?.name ?? "Workspace"}</p>
        </div>
      </div>
    </aside>
  );
}
