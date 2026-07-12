import { type ReactNode } from "react";
import { Button } from "./button";

type DialogProps = {
  open: boolean;
  title: string;
  description: string;
  children?: ReactNode;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  primaryVariant?: "primary" | "secondary" | "outline" | "ghost";
  busy?: boolean;
};

export function Dialog({
  open,
  title,
  description,
  children,
  primaryLabel = "OK",
  secondaryLabel,
  onPrimary,
  onSecondary,
  primaryVariant = "primary",
  busy = false,
}: DialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-charcoal/55 backdrop-blur-[2px]" aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sf-dialog-title"
        aria-describedby="sf-dialog-desc"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-white shadow-panel dark:border-charcoal-muted dark:bg-charcoal-soft"
      >
        <div className="border-b border-brand-500/30 bg-gradient-to-r from-brand-50 to-white px-6 py-4 dark:from-charcoal-muted dark:to-charcoal-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
            SupportFlow
          </p>
          <h2 id="sf-dialog-title" className="mt-1 text-lg font-semibold text-charcoal dark:text-white">
            {title}
          </h2>
        </div>

        <div className="px-6 py-5">
          <p id="sf-dialog-desc" className="text-sm leading-relaxed text-ink-soft dark:text-ink-faint">
            {description}
          </p>
          {children}
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-6 py-4 dark:border-charcoal-muted">
          {secondaryLabel ? (
            <Button type="button" variant="ghost" size="sm" onClick={onSecondary} disabled={busy}>
              {secondaryLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            variant={primaryVariant}
            size="sm"
            onClick={onPrimary}
            disabled={busy}
          >
            {primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
