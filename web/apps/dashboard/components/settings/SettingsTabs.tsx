"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/settings/workspace", label: "Workspace" },
  { href: "/settings/team", label: "Team" },
  { href: "/settings/widget", label: "Widget" },
] as const;

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="-mb-px flex gap-1 overflow-x-auto border-b border-line dark:border-charcoal-muted"
      aria-label="Settings sections"
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-300"
                : "border-transparent text-ink-muted hover:border-line hover:text-ink dark:text-ink-faint dark:hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
