export function AuthShowcase() {
  return (
    <div className="relative hidden min-h-screen overflow-hidden bg-charcoal lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:px-12">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 72% 18%, rgba(16,185,129,0.16), transparent 42%), radial-gradient(circle at 18% 82%, rgba(16,185,129,0.08), transparent 38%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-charcoal-soft/90 p-5 shadow-panel backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-white/90">Unified inbox — live</p>
            <span className="flex items-center gap-1.5 text-xs text-brand-400">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              live
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-charcoal-muted text-xs font-semibold text-white">
                JL
              </span>
              <div className="rounded-2xl rounded-tl-md bg-charcoal-muted px-3.5 py-2.5 text-sm leading-relaxed text-white/85">
                Hi — my order #48291 still hasn&apos;t shipped. Can someone help?
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-11 text-xs text-white/45">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/40" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/40 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/40 [animation-delay:300ms]" />
              <span className="ml-1">Agent is typing…</span>
            </div>

            <div className="rounded-xl border border-brand-500/55 bg-charcoal/70 p-3.5">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-brand-400">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                  <path d="M8 1.5 9.2 5.3 13 6.5 9.2 7.7 8 11.5 6.8 7.7 3 6.5l3.8-1.2L8 1.5Z" />
                </svg>
                AI suggested reply
              </div>
              <p className="text-sm leading-relaxed text-white/75">
                Thanks for reaching out — I&apos;m escalating this to shipping and will
                confirm a refund or replacement within the hour.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-white/50">
          Every reply, every channel, one screen.
        </p>
      </div>
    </div>
  );
}
