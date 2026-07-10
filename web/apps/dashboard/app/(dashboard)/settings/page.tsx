import Link from "next/link";
import { Card, CardContent } from "@supportflow/ui";

const settingsLinks = [
  { href: "/settings/team", label: "Team", description: "Invite and manage members" },
  { href: "/settings/widget", label: "Widget", description: "Chat widget branding" },
  { href: "/settings/workspace", label: "Workspace", description: "Name, timezone, hours" },
];

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <p className="mt-1 text-sm text-slate-500">Manage your workspace</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="py-6">
                <p className="font-medium text-slate-900">{link.label}</p>
                <p className="mt-1 text-sm text-slate-500">{link.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
