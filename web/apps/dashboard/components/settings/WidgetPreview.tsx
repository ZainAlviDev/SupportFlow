"use client";

type WidgetPreviewProps = {
  workspaceName: string;
  primaryColor: string;
  position: "bottom-left" | "bottom-right";
  welcomeMessage: string;
};

export function WidgetPreview({
  workspaceName,
  primaryColor,
  position,
  welcomeMessage,
}: WidgetPreviewProps) {
  return (
    <div className="relative h-[360px] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 via-white to-emerald-50 ring-1 ring-line dark:from-charcoal-soft dark:via-charcoal dark:to-brand-500/10 dark:ring-charcoal-muted">
      <div className="absolute inset-x-4 top-4 rounded-xl bg-white/80 p-3 text-xs text-ink-muted shadow-sm backdrop-blur dark:bg-charcoal/70 dark:text-ink-faint">
        Live preview · {workspaceName || "Support"}
      </div>

      <div
        className={`absolute bottom-4 flex w-[240px] flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-charcoal-soft dark:ring-white/10 ${
          position === "bottom-left" ? "left-4" : "right-4"
        }`}
      >
        <div className="px-3.5 py-3 text-white" style={{ backgroundColor: primaryColor }}>
          <p className="text-sm font-semibold">{workspaceName || "Support"}</p>
          <p className="text-[11px] text-white/85">We typically reply in a few minutes</p>
        </div>
        <div className="space-y-2 px-3.5 py-3">
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-surface-soft px-3 py-2 text-xs text-ink-soft dark:bg-charcoal-muted dark:text-ink-faint">
            {welcomeMessage || "Hi! How can we help?"}
          </div>
          <div className="ml-auto max-w-[75%] rounded-2xl rounded-tr-sm px-3 py-2 text-xs text-white" style={{ backgroundColor: primaryColor }}>
            I need help with my order
          </div>
        </div>
        <div className="border-t border-line px-3 py-2 dark:border-charcoal-muted">
          <div className="rounded-full bg-surface-soft px-3 py-2 text-[11px] text-ink-faint dark:bg-charcoal-muted">
            Type a message…
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-hidden
        className={`absolute bottom-4 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg ${
          position === "bottom-left" ? "left-4 translate-y-[4.8rem]" : "right-4 translate-y-[4.8rem]"
        }`}
        style={{ backgroundColor: primaryColor, display: "none" }}
      />
    </div>
  );
}
