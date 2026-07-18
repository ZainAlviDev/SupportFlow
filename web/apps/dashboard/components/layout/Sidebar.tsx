"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SupportFlowLogo } from "@/components/brand/SupportFlowLogo";

const navItems = [
  { href: "/inbox", label: "Inbox" },
  { href: "/tickets", label: "Tickets" },
  { href: "/customers", label: "Customers" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-line bg-white dark:border-charcoal-muted dark:bg-charcoal">
      <div className="flex h-16 items-center bg-charcoal px-5">
        <SupportFlowLogo inverted />
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-50 text-brand-700 dark:bg-charcoal-muted dark:text-brand-300"
                  : "text-ink-soft hover:bg-surface-soft hover:text-ink dark:text-ink-faint dark:hover:bg-charcoal-soft dark:hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-4 text-xs text-ink-faint dark:border-charcoal-muted">
        TechHub · Phase 1
      </div>
    </aside>
  );
}
