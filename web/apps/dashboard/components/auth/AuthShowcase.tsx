export function AuthShowcase() {
  return (
    <div className="relative hidden min-h-screen overflow-hidden bg-charcoal lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:px-12">
      {/* Ambient glow + dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 75% 15%, rgba(16,185,129,0.18), transparent 45%), radial-gradient(circle at 15% 85%, rgba(16,185,129,0.10), transparent 40%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(circle at 50% 40%, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 40%, black 0%, transparent 75%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Headline */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
            SupportFlow · AI Customer Support
          </span>
          <h2 className="mt-4 text-2xl font-bold leading-snug tracking-tight text-white">
            Every conversation,
            <br />
            <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
              one calm inbox.
            </span>
          </h2>
        </div>

        {/* Floating stat badges */}
        <div className="relative">
          <div className="absolute -left-10 -top-5 z-20 hidden rounded-xl border border-white/10 bg-charcoal-soft/95 px-3.5 py-2.5 shadow-panel backdrop-blur xl:block">
            <p className="text-[11px] text-white/50">Avg. first reply</p>
            <p className="text-lg font-bold text-brand-400">32s</p>
          </div>
          <div className="absolute -right-8 -bottom-6 z-20 hidden rounded-xl border border-white/10 bg-charcoal-soft/95 px-3.5 py-2.5 shadow-panel backdrop-blur xl:block">
            <p className="text-[11px] text-white/50">CSAT this week</p>
            <p className="text-lg font-bold text-brand-400">98%</p>
          </div>

          {/* Live inbox card */}
          <div className="rounded-2xl border border-white/10 bg-charcoal-soft/90 p-5 shadow-panel backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500 text-[11px] font-bold text-white">
                  SF
                </span>
                <p className="text-sm font-medium text-white/90">Unified inbox</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-brand-500/10 px-2 py-0.5 text-xs text-brand-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
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

              <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[11px] text-white/45">
                  <svg viewBox="0 0 16 16" className="h-3 w-3 text-brand-400" fill="none" aria-hidden>
                    <path
                      d="m3.5 8.5 3 3 6-6.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Resolved in 4 minutes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature ticks */}
        <div className="mt-8 flex items-center justify-center gap-5 text-xs text-white/55">
          {["Real-time inbox", "AI replies", "Website widget"].map((feature) => (
            <span key={feature} className="flex items-center gap-1.5">
              <svg viewBox="0 0 16 16" className="h-3 w-3 text-brand-400" fill="none" aria-hidden>
                <path
                  d="m3.5 8.5 3 3 6-6.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
