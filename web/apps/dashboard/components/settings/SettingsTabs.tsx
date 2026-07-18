"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/settings/workspace",
    label: "Workspace",
    description: "Name & timezone",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    ),
  },
  {
    href: "/settings/team",
    label: "Team",
    description: "Members & invites",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/settings/widget",
    label: "Widget",
    description: "Branding & embed",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8Z" />
      </svg>
    ),
  },
] as const;

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings sections"
      className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm ring-1 ring-line lg:h-fit lg:flex-col dark:bg-charcoal-soft dark:ring-charcoal-muted"
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-50 text-brand-700 dark:bg-charcoal-muted dark:text-brand-300"
                : "text-ink-soft hover:bg-surface-soft hover:text-ink dark:text-ink-faint dark:hover:bg-charcoal-muted dark:hover:text-white"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                active
                  ? "bg-brand-500 text-white"
                  : "bg-surface-soft text-ink-muted dark:bg-charcoal-muted"
              }`}
            >
              {tab.icon}
            </span>
            <span className="min-w-0">
              <span className="block">{tab.label}</span>
              <span className="hidden text-[11px] font-normal text-ink-faint lg:block">
                {tab.description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
