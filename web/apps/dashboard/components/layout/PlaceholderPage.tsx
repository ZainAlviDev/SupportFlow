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
        <h1 className="text-2xl font-semibold text-charcoal">{title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="mb-4 text-4xl">🚧</p>
          <p className="font-medium text-ink-soft">Coming in {module}</p>
          <p className="mt-2 text-sm text-ink-muted">
            Page scaffold is ready — connect to backend APIs when available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
