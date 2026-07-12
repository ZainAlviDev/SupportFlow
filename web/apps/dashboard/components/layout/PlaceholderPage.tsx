import { Card, CardContent } from "@supportflow/ui";

type PlaceholderPageProps = {
  title: string;
  description: string;
  module: string;
};

export function PlaceholderPage({ title, description, module }: PlaceholderPageProps) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-charcoal dark:text-white">{title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </div>
      <Card className="dark:border-charcoal-muted dark:bg-charcoal">
        <CardContent className="py-12 text-center">
          <p className="font-medium text-ink-soft dark:text-ink-faint">Coming in {module}</p>
          <p className="mt-2 text-sm text-ink-muted">
            Page scaffold is ready — connect to backend APIs when available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
