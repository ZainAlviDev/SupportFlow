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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-line bg-white">
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
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-soft hover:bg-surface-soft hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-4 text-xs text-ink-faint">
        TechHub · Phase 1
      </div>
    </aside>
  );
}
