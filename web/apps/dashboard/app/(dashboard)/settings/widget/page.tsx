import { Card, CardContent } from "@supportflow/ui";
import Link from "next/link";

export default function WidgetSettingsPage() {
  return (
    <div>
      <p className="mb-4 text-sm text-ink-muted">
        Customize chat widget appearance and behavior.
      </p>
      <Card className="max-w-xl dark:border-charcoal-muted dark:bg-charcoal">
        <CardContent className="py-12 text-center">
          <p className="font-medium text-ink-soft dark:text-ink-faint">Coming in Module 7</p>
          <p className="mt-2 text-sm text-ink-muted">
            Widget branding and embed settings will connect here when the API is ready.
          </p>
          <p className="mt-4 text-sm text-ink-muted">
            Continue with{" "}
            <Link href="/settings/workspace" className="font-medium text-brand-700 hover:underline">
              Workspace
            </Link>{" "}
            or{" "}
            <Link href="/settings/team" className="font-medium text-brand-700 hover:underline">
              Team
            </Link>{" "}
            settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
